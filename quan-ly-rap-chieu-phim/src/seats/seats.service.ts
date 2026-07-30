import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat } from './seat.entity';
import { UpdateSeatDto } from './dto/update-seat.dto';

// Mỗi phòng cố định 80 ghế (30 thường + 40 vip + 10 couple) — theo nghiệp vụ
// KHÔNG thêm/bớt ghế qua giao diện lẫn qua API. Vì vậy service này CHỦ Ý
// không có create()/remove(): dữ liệu ghế chỉ được khởi tạo qua seed, chỉ
// cho phép update (vd. sửa loại ghế) khi thật sự cần sửa lỗi dữ liệu.
@Injectable()
export class SeatsService {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async findAll(): Promise<Seat[]> {
    return this.seatRepository.find({ order: { seat_id: 'ASC' } });
  }

  async findOne(id: number): Promise<Seat> {
    const seat = await this.seatRepository.findOne({ where: { seat_id: id } });
    if (!seat) {
      throw new NotFoundException(`Không tìm thấy ghế có id = ${id}`);
    }
    return seat;
  }

  async update(id: number, updateSeatDto: UpdateSeatDto): Promise<Seat> {
    const seat = await this.findOne(id);
    Object.assign(seat, updateSeatDto);
    return this.seatRepository.save(seat);
  }
}