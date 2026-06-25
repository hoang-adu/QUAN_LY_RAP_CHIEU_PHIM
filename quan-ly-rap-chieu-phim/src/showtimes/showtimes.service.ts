import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(createShowtimeDto: CreateShowtimeDto): Promise<Showtime> {
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

  async update(id: number, updateShowtimeDto: UpdateShowtimeDto): Promise<Showtime> {
    const showtime = await this.findOne(id);
    Object.assign(showtime, updateShowtimeDto);
    return this.showtimeRepository.save(showtime);
  }

  async remove(id: number): Promise<{ message: string }> {
    const showtime = await this.findOne(id);
    await this.showtimeRepository.remove(showtime);
    return { message: `Đã xóa suất chiếu có id = ${id}` };
  }
}
