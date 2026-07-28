import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutBookingDto } from './dto/checkout-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthedRequest {
  user: { role?: string; customer_id?: number; employee_id?: number };
}

// POST /bookings/checkout
// Gộp "tạo đơn + tạo vé cho từng ghế đã chọn + thu tiền" thành 1 API duy
// nhất — dùng chung cho cả khách hàng tự đặt online (CustomerBookingPage)
// lẫn nhân viên bán tại quầy (NewBookingPage). Yêu cầu đăng nhập; quyền
// chi tiết theo từng khách/nhân viên được kiểm tra trong CheckoutService.
@UseGuards(JwtAuthGuard)
@Controller('bookings/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  checkout(@Body() dto: CheckoutBookingDto, @Request() req: AuthedRequest) {
    return this.checkoutService.checkout(dto, req.user);
  }
}
