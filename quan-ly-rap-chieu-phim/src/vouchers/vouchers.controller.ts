import { Body, Controller, ForbiddenException, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface AuthedRequest {
  user: { role?: string; customer_id?: number; employee_id?: number };
}

// Khách hàng: đổi/xem voucher của chính mình.
// Nhân viên/admin: đổi điểm HỘ khách tại quầy (chỉ định customer_id) và
// xem toàn bộ voucher để đối soát — vì khách đến quầy có thể không đăng
// nhập trên thiết bị của quầy, nhân viên vẫn cần tra điểm + đổi được.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Roles('customer', 'admin', 'employee')
  @Post('redeem')
  redeem(@Body() dto: RedeemVoucherDto, @Request() req: AuthedRequest) {
    const isStaff = req.user.role === 'admin' || req.user.role === 'employee';
    if (isStaff) {
      if (!dto.customer_id) {
        throw new ForbiddenException('Vui lòng chọn khách hàng cần đổi điểm.');
      }
      return this.vouchersService.redeem(Number(dto.customer_id), dto);
    }
    return this.vouchersService.redeem(Number(req.user.customer_id), dto);
  }

  @Roles('customer')
  @Get('mine')
  findMine(@Request() req: AuthedRequest) {
    return this.vouchersService.findMine(Number(req.user.customer_id));
  }

  // Nhân viên/admin tra voucher của 1 khách cụ thể (vd. lúc khách đến quầy
  // muốn dùng voucher) hoặc toàn bộ voucher (đối soát) nếu bỏ trống
  // customer_id. Điểm tích lũy hiện tại của khách xem qua GET /customers/:id.
  @Roles('admin', 'employee')
  @Get()
  findAll(@Query('customer_id') customerId?: string) {
    return this.vouchersService.findAll(customerId ? Number(customerId) : undefined);
  }
}