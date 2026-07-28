import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
  ParseIntPipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { SeatsService } from './seats.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Mỗi phòng cố định 80 ghế (30 thường + 40 vip + 10 couple) — theo nghiệp vụ
// KHÔNG thêm/bớt ghế qua giao diện. Ghi (create/update/delete) chỉ dành cho
// admin để sửa lỗi dữ liệu khi thật sự cần; đọc thì public vì mọi trang đặt
// vé (kể cả khách chưa đăng nhập xem sơ đồ) đều cần danh sách ghế.
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createSeatDto: CreateSeatDto) {
    return this.seatsService.create(createSeatDto);
  }

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.seatsService.remove(id);
  }
}