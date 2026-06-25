import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat } from './seat.entity';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';

@Injectable()
export class SeatsService {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async create(createSeatDto: CreateSeatDto): Promise<Seat> {
    const seat = this.seatRepository.create(createSeatDto);
    return this.seatRepository.save(seat);
  }

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

  async remove(id: number): Promise<{ message: string }> {
    const seat = await this.findOne(id);
    await this.seatRepository.remove(seat);
    return { message: `Đã xóa ghế có id = ${id}` };
  }
}
