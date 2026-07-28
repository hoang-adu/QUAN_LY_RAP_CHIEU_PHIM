import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Showtime } from './showtime.entity';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimeRepository: Repository<Showtime>,
  ) {}

  // Kiểm tra 1 phòng chiếu có bị trùng suất (cùng ngày, khoảng giờ giao nhau)
  // hay không. 2 khoảng thời gian [start1,end1) và [start2,end2) giao nhau
  // khi và chỉ khi start1 < end2 VÀ start2 < end1.
  private async assertNoConflict(
    roomId: number | undefined,
    showDate: string | undefined,
    startTime: string | undefined,
    endTime: string | undefined,
    excludeShowtimeId?: number,
  ): Promise<void> {
    // Thiếu dữ liệu thì không đủ căn cứ để so trùng (DB sẽ tự chặn NOT NULL).
    if (!roomId || !showDate || !startTime || !endTime) return;

    const qb = this.showtimeRepository
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

  async create(createShowtimeDto: CreateShowtimeDto): Promise<Showtime> {
    await this.assertNoConflict(
      createShowtimeDto.room_id,
      createShowtimeDto.show_date,
      createShowtimeDto.start_time,
      createShowtimeDto.end_time,
    );
    const showtime = this.showtimeRepository.create(createShowtimeDto);
    return this.showtimeRepository.save(showtime);
  }

  async findAll(): Promise<Showtime[]> {
    return this.showtimeRepository.find({ order: { showtime_id: 'ASC' } });
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
    const showtime = await this.findOne(id);
    // Ghép dữ liệu mới (có thể chỉ sửa 1 vài trường) vào bản ghi hiện tại
    // trước khi kiểm tra trùng, để không bỏ sót trường hợp chỉ đổi giờ/phòng.
    const merged = { ...showtime, ...updateShowtimeDto };
    await this.assertNoConflict(
      merged.room_id,
      merged.show_date,
      merged.start_time,
      merged.end_time,
      id,
    );
    Object.assign(showtime, updateShowtimeDto);
    return this.showtimeRepository.save(showtime);
  }

  async remove(id: number): Promise<{ message: string }> {
    const showtime = await this.findOne(id);
    await this.showtimeRepository.remove(showtime);
    return { message: `Đã xóa suất chiếu có id = ${id}` };
  }
}