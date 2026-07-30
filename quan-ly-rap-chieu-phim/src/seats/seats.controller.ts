import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SeatsService } from './seats.service';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Mỗi phòng cố định 80 ghế (30 thường + 40 vip + 10 couple) — theo nghiệp vụ
// KHÔNG thêm/bớt ghế qua giao diện. Endpoint create/delete đã bị GỠ BỎ hẳn ở
// backend (không chỉ ẩn UI) để không thể phá vỡ ràng buộc này dù gọi thẳng
// API. Chỉ còn cho phép admin sửa dữ liệu ghế khi cần; đọc thì public vì mọi
// trang đặt vé (kể cả khách chưa đăng nhập xem sơ đồ) đều cần danh sách ghế.
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Get()
  findAll() {
    return this.seatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.seatsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSeatDto: UpdateSeatDto,
  ) {
    return this.seatsService.update(id, updateSeatDto);
  }
}