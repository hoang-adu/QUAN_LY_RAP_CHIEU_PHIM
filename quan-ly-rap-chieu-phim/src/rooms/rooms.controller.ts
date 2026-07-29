import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Phòng chiếu cố định (5 phòng x 80 ghế) — theo nghiệp vụ KHÔNG được thêm/xóa
// phòng qua giao diện. Endpoint create/delete đã bị GỠ BỎ hẳn ở backend (không
// chỉ ẩn UI) để không thể phá vỡ ràng buộc này dù gọi thẳng API. Chỉ còn cho
// phép admin sửa (vd. đổi tên phòng); đọc thì public để khách xem lịch chiếu
// theo phòng.
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, updateRoomDto);
  }
}