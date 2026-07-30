import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { UpdateRoomDto } from './dto/update-room.dto';

// Phòng chiếu cố định (5 phòng x 80 ghế) — theo nghiệp vụ KHÔNG được thêm/xóa
// phòng qua giao diện lẫn qua API. Vì vậy service này CHỦ Ý không có create()
// / remove(): dữ liệu phòng chỉ được khởi tạo qua seed, chỉ cho phép sửa
// (update) các trường như tên phòng khi cần.
@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

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
}