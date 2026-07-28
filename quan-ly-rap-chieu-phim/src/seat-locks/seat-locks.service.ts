import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SeatLock } from './seat-lock.entity';
import { Ticket } from '../tickets/ticket.entity';

export interface Holder {
  holder_type: 'customer' | 'employee';
  holder_id: number;
}

// Thời gian giữ ghế tạm thời: 5 phút. Hết hạn mà không thanh toán/gia hạn
// thì ghế coi như trống trở lại, người khác giữ được.
export const SEAT_LOCK_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class SeatLocksService {
  constructor(
    @InjectRepository(SeatLock)
    private readonly seatLockRepository: Repository<SeatLock>,
    private readonly dataSource: DataSource,
  ) {}

  
  private isSameHolder(lock: SeatLock, holder: Holder): boolean {
    return (
      lock.holder_type === holder.holder_type &&
      lock.holder_id === holder.holder_id
    );
  }

  private isExpired(lock: SeatLock): boolean {
    return lock.expires_at.getTime() < Date.now();
  }

  // ─────────────────────────────────────────
  // Giữ ghế (hoặc gia hạn nếu đang tự giữ) — transaction + pessimistic
  // lock để 2 request chọn cùng 1 ghế cùng lúc không thể cùng "thắng".
  // ─────────────────────────────────────────
  async hold(
    showtimeId: number,
    seatId: number,
    holder: Holder,
  ): Promise<SeatLock> {
    return this.dataSource.transaction(async (manager) => {
      // Ghế đã bán (có vé) thì không cho giữ nữa.
      const sold = await manager.getRepository(Ticket).findOne({
        where: { showtime_id: showtimeId, seat_id: seatId },
      });
      if (sold) {
        throw new ConflictException(
          `Ghế #${seatId} đã được bán cho suất chiếu #${showtimeId}`,
        );
      }

      const lockRepo = manager.getRepository(SeatLock);
      const existing = await lockRepo
        .createQueryBuilder('l')
        .setLock('pessimistic_write')
        .where('l.showtime_id = :showtimeId', { showtimeId })
        .andWhere('l.seat_id = :seatId', { seatId })
        .getOne();

      const expiresAt = new Date(Date.now() + SEAT_LOCK_TTL_MS);

      if (!existing) {
        const lock = lockRepo.create({
          showtime_id: showtimeId,
          seat_id: seatId,
          holder_type: holder.holder_type,
          holder_id: holder.holder_id,
          expires_at: expiresAt,
        });
        try {
          return await lockRepo.save(lock);
        } catch (err) {
          const code = (err as { code?: string })?.code;
          if (code === 'ER_DUP_ENTRY') {
            throw new ConflictException(
              `Ghế #${seatId} vừa được người khác giữ, vui lòng thử lại.`,
            );
          }
          throw err;
        }
      }

      const sameHolder = this.isSameHolder(existing, holder);
      if (!sameHolder && !this.isExpired(existing)) {
        throw new ConflictException(
          `Ghế #${seatId} đang được người khác giữ, vui lòng chọn ghế khác hoặc thử lại sau.`,
        );
      }

      // Lock đã hết hạn, hoặc chính chủ đang gia hạn -> ghi đè/giữ tiếp.
      existing.holder_type = holder.holder_type;
      existing.holder_id = holder.holder_id;
      existing.expires_at = expiresAt;
      return lockRepo.save(existing);
    });
  }

  // ─────────────────────────────────────────
  // Nhả ghế chủ động (bỏ chọn ghế / rời trang / hủy thao tác).
  // ─────────────────────────────────────────
  async release(
    showtimeId: number,
    seatId: number,
    holder: Holder,
  ): Promise<{ message: string }> {
    const lock = await this.seatLockRepository.findOne({
      where: { showtime_id: showtimeId, seat_id: seatId },
    });
    if (!lock) {
      return { message: 'Ghế không (còn) bị giữ' };
    }
    if (!this.isSameHolder(lock, holder) && !this.isExpired(lock)) {
      throw new ForbiddenException('Bạn không giữ ghế này nên không thể nhả');
    }
    await this.seatLockRepository.delete(lock.lock_id);
    return { message: `Đã nhả ghế #${seatId}` };
  }

  // ─────────────────────────────────────────
  // Danh sách ghế đang bị giữ (còn hiệu lực) của 1 suất chiếu — FE dùng để
  // vẽ sơ đồ ghế realtime, tô "đang được giữ" khác màu với "đã bán".
  // ─────────────────────────────────────────
  async findActiveForShowtime(
    showtimeId: number,
    viewer?: Holder,
  ): Promise<Array<{ seat_id: number; expires_at: Date; mine: boolean }>> {
    const locks = await this.seatLockRepository.find({
      where: { showtime_id: showtimeId },
    });
    const now = Date.now();
    return locks
      .filter((l) => l.expires_at.getTime() >= now)
      .map((l) => ({
        seat_id: l.seat_id,
        expires_at: l.expires_at,
        mine: !!viewer && this.isSameHolder(l, viewer),
      }));
  }

  // ─────────────────────────────────────────
  // Dùng bởi TicketsService NGAY TRƯỚC khi tạo vé: nếu ghế đang bị người
  // KHÁC giữ (còn hiệu lực) thì chặn sớm với thông báo thân thiện, thay vì
  // để lọt xuống lỗi UNIQUE thô ở tầng DB.
  // ─────────────────────────────────────────
  async assertAvailableFor(
    showtimeId: number,
    seatId: number,
    holder: Holder,
  ): Promise<void> {
    const lock = await this.seatLockRepository.findOne({
      where: { showtime_id: showtimeId, seat_id: seatId },
    });
    if (lock && !this.isSameHolder(lock, holder) && !this.isExpired(lock)) {
      throw new ConflictException(
        `Ghế #${seatId} đang được người khác giữ, vui lòng thử lại sau.`,
      );
    }
  }

  // ─────────────────────────────────────────
  // Dùng bởi TicketsService NGAY SAU khi tạo vé thành công: xoá lock vì ghế
  // đã bán, không cần giữ tạm nữa.
  // ─────────────────────────────────────────
  async releaseAfterPurchase(
    showtimeId: number,
    seatId: number,
  ): Promise<void> {
    await this.seatLockRepository.delete({
      showtime_id: showtimeId,
      seat_id: seatId,
    });
  }
}
