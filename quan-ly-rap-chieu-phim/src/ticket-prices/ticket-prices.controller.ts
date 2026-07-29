import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TicketPricesService } from './ticket-prices.service';
import { CreateTicketPriceDto } from './dto/create-ticket-price.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface RequestUser {
  employee_id?: number;
  role?: string;
}

@Controller('ticket-prices')
export class TicketPricesController {
  constructor(private readonly service: TicketPricesService) {}

  // Public: trang chọn ghế của khách (đã đăng nhập hay chưa) cần biết
  // giá từng loại ghế để hiển thị trước khi đặt.
  @Get('current')
  getCurrent() {
    return this.service.getCurrentPrices();
  }

  // Lịch sử đổi giá — chỉ admin/employee xem (thông tin quản trị nội bộ).
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Get('history')
  getHistory(@Query('seat_type') seatType?: string) {
    return this.service.getHistory(seatType);
  }

  // Đổi giá — CHỈ ADMIN. Tạo 1 dòng giá mới, có hiệu lực ngay cho các vé
  // bán TỪ THỜI ĐIỂM NÀY trở đi; vé đã bán trước đó không bị ảnh hưởng.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateTicketPriceDto, @Req() req: { user?: RequestUser }) {
    return this.service.create({
      ...dto,
      changed_by: req.user?.employee_id,
    });
  }
}
