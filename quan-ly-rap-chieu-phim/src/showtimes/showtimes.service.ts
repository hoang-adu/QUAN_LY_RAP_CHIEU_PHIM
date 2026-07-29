import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Showtime } from './showtime.entity';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { Room } from '../rooms/room.entity';
import { Ticket } from '../tickets/ticket.entity';

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimeRepository: Repository<Showtime>,
    private readonly dataSource: DataSource,
  ) {}

  // Kiểm tra 1 phòng chiếu có bị trùng suất (cùng ngày, khoảng giờ giao nhau)
  // hay không. 2 khoảng thời gian [start1,end1) và [start2,end2) giao nhau
  // khi và chỉ khi start1 < end2 VÀ start2 < end1.
  private async assertNoConflict(
    manager: EntityManager,
    roomId: number | undefined,
    showDate: string | undefined,
    startTime: string | undefined,
    endTime: string | undefined,
    excludeShowtimeId?: number,
  ): Promise<void> {
    // Thiếu dữ liệu thì không đủ căn cứ để so trùng (DB sẽ tự chặn NOT NULL).
    if (!roomId || !showDate || !startTime || !endTime) return;

    const qb = manager
      .getRepository(Showtime)
      .createQueryBuilder('s')
      .where('s.room_id = :roomId', { roomId })
      .andWhere('s.show_date = :showDate', { showDate })
      .andWhere('s.start_time < :endTime', { endTime })
      .andWhere('s.end_time > :startTime', { startTime });

    if (excludeShowtimeId) {
      qb.andWhere('s.showtime_id != :excludeShowtimeId', {
        excludeShowtimeId,
      });
    }

    const conflict = await qb.getOne();
    if (conflict) {
      throw new ConflictException(
        `Trùng lịch chiếu: Phòng đã có suất chiếu #${conflict.showtime_id} ` +
          `vào ngày ${showDate} (${conflict.start_time?.slice(0, 5)} - ` +
          `${conflict.end_time?.slice(0, 5)}). Vui lòng chọn lại ngày, giờ hoặc phòng khác.`,
      );
    }
  }

  // Không cho tạo suất chiếu mới với ngày đã qua — chỉ áp dụng khi TẠO MỚI,
  // không áp dụng khi UPDATE để không chặn việc admin sửa lại 1 suất cũ đã
  // lỡ nhập sai (vd. đổi phòng/giờ cho 1 suất đã diễn ra để khớp lịch sử).
  private assertNotPastDate(showDate: string | undefined): void {
    if (!showDate) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    if (showDate < todayStr) {
      throw new BadRequestException(
        `Không thể tạo suất chiếu cho ngày ${showDate} vì đây là ngày đã qua. ` +
          `Vui lòng chọn ngày từ hôm nay (${todayStr}) trở đi.`,
      );
    }
  }

  // Khóa hàng của phòng (pessimistic_write) trong transaction để 2 admin/
  // nhân viên cùng bấm tạo/sửa suất chiếu trùng giờ trong CÙNG 1 phòng gần
  // như cùng lúc không thể cùng lọt qua bước kiểm tra trùng lịch — tương tự
  // cơ chế lock đã dùng ở seat-locks. Khoá theo room_id nên không ảnh hưởng
  // đến việc tạo suất chiếu song song ở các phòng khác nhau.
  private async lockRoom(
    manager: EntityManager,
    roomId: number | undefined,
  ): Promise<void> {
    if (!roomId) return;
    await manager
      .getRepository(Room)
      .createQueryBuilder('r')
      .setLock('pessimistic_write')
      .where('r.room_id = :roomId', { roomId })
      .getOne();
  }

  async create(createShowtimeDto: CreateShowtimeDto): Promise<Showtime> {
    this.assertNotPastDate(createShowtimeDto.show_date);
    return this.dataSource.transaction(async (manager) => {
      await this.lockRoom(manager, createShowtimeDto.room_id);
      await this.assertNoConflict(
        manager,
        createShowtimeDto.room_id,
        createShowtimeDto.show_date,
        createShowtimeDto.start_time,
        createShowtimeDto.end_time,
      );
      const showtime = manager
        .getRepository(Showtime)
        .create(createShowtimeDto);
      return manager.getRepository(Showtime).save(showtime);
    });
  }

  async findAll(): Promise<Showtime[]> {
    // Sắp theo ngày + giờ chiếu (không phải theo id/thứ tự tạo), để suất mới
    // tạo hiện đúng vị trí theo thời gian chiếu thay vì luôn rơi xuống cuối bảng.
    return this.showtimeRepository.find({
      order: { show_date: 'ASC', start_time: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Showtime> {
    const showtime = await this.showtimeRepository.findOne({
      where: { showtime_id: id },
    });
    if (!showtime) {
      throw new NotFoundException(`Không tìm thấy suất chiếu có id = ${id}`);
    }
    return showtime;
  }

  async update(
    id: number,
    updateShowtimeDto: UpdateShowtimeDto,
  ): Promise<Showtime> {
    return this.dataSource.transaction(async (manager) => {
      const showtime = await manager.getRepository(Showtime).findOne({
        where: { showtime_id: id },
      });
      if (!showtime) {
        throw new NotFoundException(`Không tìm thấy suất chiếu có id = ${id}`);
      }
      // Ghép dữ liệu mới (có thể chỉ sửa 1 vài trường) vào bản ghi hiện tại
      // trước khi kiểm tra trùng, để không bỏ sót trường hợp chỉ đổi giờ/phòng.
      const merged = { ...showtime, ...updateShowtimeDto };
      await this.lockRoom(manager, merged.room_id);
      await this.assertNoConflict(
        manager,
        merged.room_id,
        merged.show_date,
        merged.start_time,
        merged.end_time,
        id,
      );
      Object.assign(showtime, updateShowtimeDto);
      return manager.getRepository(Showtime).save(showtime);
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const showtime = await this.findOne(id);

    // Kiểm tra tường minh trước khi xóa: suất chiếu đã có vé bán thì không
    // cho xóa, trả thông báo nghiệp vụ rõ ràng thay vì để lỗi SQL thô (500)
    // do ràng buộc FOREIGN KEY ... ON DELETE RESTRICT ném ra.
    const ticketCount = await this.dataSource
      .getRepository(Ticket)
      .count({ where: { showtime_id: id } });
    if (ticketCount > 0) {
      throw new BadRequestException(
        `Không thể xóa suất chiếu #${id} vì đã có ${ticketCount} vé được bán cho suất chiếu này.`,
      );
    }

    try {
      await this.showtimeRepository.remove(showtime);
    } catch (err) {
      // Lớp phòng thủ thứ 2: nếu vẫn vỡ ràng buộc khóa ngoại vì lý do khác
      // (vd. race condition giữa lúc đếm vé và lúc xóa), trả lỗi thân thiện
      // thay vì để lộ lỗi SQL thô ra ngoài.
      const code = (err as { code?: string })?.code;
      if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED') {
        throw new BadRequestException(
          `Không thể xóa suất chiếu #${id} vì đang có dữ liệu liên quan (vé/đơn) tham chiếu tới.`,
        );
      }
      throw err;
    }

    return { message: `Đã xóa suất chiếu có id = ${id}` };
  }
}