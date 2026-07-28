import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ticket } from './ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { SeatLocksService, Holder } from '../seat-locks/seat-locks.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly dataSource: DataSource,
    private readonly seatLocksService: SeatLocksService,
  ) {}

  // ─────────────────────────────────────────
  // CREATE — Tạo vé mới
  // 2 lớp bảo vệ khỏi race condition (2 người cùng mua 1 ghế 1 lúc):
  //  1) Nghiệp vụ: nếu holder được truyền vào (người đang thực hiện thao
  //     tác) thì kiểm tra ghế không đang bị NGƯỜI KHÁC giữ tạm (seat-lock)
  //     -> chặn sớm với thông báo thân thiện.
  //  2) CSDL: transaction + lock hàng (pessimistic_write) + bắt lỗi
  //     UNIQUE(showtime_id, seat_id) -> lớp phòng thủ cuối cùng, luôn chạy
  //     dù có seat-lock hay không (vd. bán tại quầy không qua bước giữ ghế).
  // Sau khi tạo vé thành công -> nhả seat-lock (nếu có) vì ghế đã bán.
  // ─────────────────────────────────────────
  async create(dto: CreateTicketDto, holder?: Holder): Promise<Ticket> {
    if (holder) {
      await this.seatLocksService.assertAvailableFor(
        dto.showtime_id,
        dto.seat_id,
        holder,
      );
    }

    const ticket = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Ticket);

      // Lock hàng liên quan (nếu có) để 2 request đồng thời không cùng lọt qua
      // bước kiểm tra trước khi insert (giảm race condition, MySQL InnoDB).
      const existing = await repo
        .createQueryBuilder('t')
        .setLock('pessimistic_write')
        .where('t.showtime_id = :showtimeId', { showtimeId: dto.showtime_id })
        .andWhere('t.seat_id = :seatId', { seatId: dto.seat_id })
        .getOne();

      if (existing) {
        throw new BadRequestException(
          `Ghế #${dto.seat_id} đã được đặt cho suất chiếu #${dto.showtime_id}`,
        );
      }

      try {
        const ticket = repo.create(dto);
        return await repo.save(ticket);
      } catch (err) {
        // Phòng hờ: nếu vẫn lọt race condition, ràng buộc UNIQUE(showtime_id,
        // seat_id) ở CSDL sẽ chặn insert thứ 2 — bắt lỗi đó và trả thông báo
        // thân thiện thay vì để lộ lỗi SQL thô ra ngoài.
        const code = (err as { code?: string })?.code;
        if (code === 'ER_DUP_ENTRY') {
          throw new BadRequestException(
            `Ghế #${dto.seat_id} vừa được người khác đặt cho suất chiếu #${dto.showtime_id}, vui lòng chọn ghế khác.`,
          );
        }
        throw err;
      }
    });

    // Ghế đã bán -> không cần giữ tạm nữa, nhả lock (nếu có) cho gọn dữ liệu.
    await this.seatLocksService.releaseAfterPurchase(
      dto.showtime_id,
      dto.seat_id,
    );

    return ticket;
  }

  // ─────────────────────────────────────────
  // READ ALL — Lấy danh sách tất cả vé
  // ─────────────────────────────────────────
  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      order: { ticket_id: 'ASC' },
    });
  }

  // ─────────────────────────────────────────
  // READ ONE — Lấy chi tiết 1 vé theo ID
  // ─────────────────────────────────────────
  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticket_id: id },
    });

    if (!ticket) {
      throw new NotFoundException(`Không tìm thấy vé có ID #${id}`);
    }

    return ticket;
  }

  // ─────────────────────────────────────────
  // READ BY BOOKING — Lấy vé theo booking_id
  // ─────────────────────────────────────────
  async findByBooking(bookingId: number): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { booking_id: bookingId },
      order: { ticket_id: 'ASC' },
    });
  }

  // ─────────────────────────────────────────
  // UPDATE — Cập nhật thông tin vé
  // ─────────────────────────────────────────
  async update(id: number, dto: UpdateTicketDto): Promise<Ticket> {
    // Kiểm tra vé tồn tại
    await this.findOne(id);

    // Nếu đổi ghế/suất chiếu → kiểm tra trùng
    if (dto.showtime_id !== undefined || dto.seat_id !== undefined) {
      const current = await this.findOne(id);
      const showtime_id = dto.showtime_id ?? current.showtime_id;
      const seat_id = dto.seat_id ?? current.seat_id;

      const conflict = await this.ticketRepository.findOne({
        where: { showtime_id, seat_id },
      });

      if (conflict && conflict.ticket_id !== id) {
        throw new BadRequestException(
          `Ghế #${seat_id} đã được đặt cho suất chiếu #${showtime_id}`,
        );
      }
    }

    await this.ticketRepository.update(id, dto);
    return this.findOne(id);
  }

  // ─────────────────────────────────────────
  // DELETE — Xóa vé
  // ─────────────────────────────────────────
  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id); // throws 404 nếu không tồn tại
    await this.ticketRepository.delete(id);
    return { message: `Đã xóa vé #${id} thành công` };
  }
}