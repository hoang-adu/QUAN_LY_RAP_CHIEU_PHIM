import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(createRoomDto);
    return this.roomRepository.save(room);
  }

  async findAll(): Promise<Room[]> {
    return this.roomRepository.find({ order: { room_id: 'ASC' } });
  }

  async findOne(id: number): Promise<Room> {
    const room = await this.roomRepository.findOne({ where: { room_id: id } });
    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng có id = ${id}`);
    }
    return room;
  }

  async update(id: number, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, updateRoomDto);
    return this.roomRepository.save(room);
  }

  async remove(id: number): Promise<{ message: string }> {
    const room = await this.findOne(id);
    await this.roomRepository.remove(room);
    return { message: `Đã xóa phòng có id = ${id}` };
  }
}
