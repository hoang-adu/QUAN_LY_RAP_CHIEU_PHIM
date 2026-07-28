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
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface AuthedRequest {
  user: { role?: string; customer_id?: number; employee_id?: number };
}

// Mọi route đều yêu cầu đăng nhập. Khách hàng chỉ thấy/tạo được booking của
// chính mình; nhân viên/admin thấy và quản lý được mọi booking (bán vé tại quầy).
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: AuthedRequest,
  ) {
    const user = req.user;
    const isStaff = user?.role === 'admin' || user?.role === 'employee';
    if (!isStaff && user?.customer_id !== createBookingDto.customer_id) {
      throw new ForbiddenException('Bạn chỉ có thể đặt vé cho chính mình');
    }
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  findAll(@Request() req: AuthedRequest) {
    const user = req.user;
    const isStaff = user?.role === 'admin' || user?.role === 'employee';
    return this.bookingsService.findAll(isStaff ? undefined : user.customer_id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthedRequest,
  ) {
    const booking = await this.bookingsService.findOne(id);
    const user = req.user;
    const isStaff = user?.role === 'admin' || user?.role === 'employee';
    if (!isStaff && booking.customer_id !== user?.customer_id) {
      throw new ForbiddenException('Bạn không có quyền xem đơn đặt vé này');
    }
    return booking;
  }

  // Chỉ nhân viên/admin được sửa trạng thái/tiền của booking, tránh khách
  // hàng tự ý đổi trạng thái để "hủy vé rồi vẫn giữ ghế đã thanh toán".
  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.remove(id);
  }
}