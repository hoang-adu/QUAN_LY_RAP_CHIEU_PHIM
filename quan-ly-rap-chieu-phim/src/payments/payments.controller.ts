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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BookingsService } from '../bookings/bookings.service';

interface AuthedRequest {
  user: { role?: string; customer_id?: number; employee_id?: number };
}

// Dữ liệu thanh toán là tài chính nhạy cảm -> mọi route đều yêu cầu đăng
// nhập. Khách hàng chỉ thanh toán/xem được payment gắn với booking của
// chính mình; sửa/xóa payment (đối soát, hoàn tiền thủ công...) chỉ nhân
// viên/admin mới được làm.
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Post()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req: AuthedRequest,
  ) {
    const user = req.user;
    const isStaff = user?.role === 'admin' || user?.role === 'employee';
    if (!isStaff) {
      const booking = await this.bookingsService.findOne(
        createPaymentDto.booking_id,
      );
      if (booking.customer_id !== user?.customer_id) {
        throw new ForbiddenException(
          'Bạn chỉ có thể thanh toán cho đơn đặt vé của chính mình',
        );
      }
    }
    return this.paymentsService.create(createPaymentDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthedRequest,
  ) {
    const payment = await this.paymentsService.findOne(id);
    const user = req.user;
    const isStaff = user?.role === 'admin' || user?.role === 'employee';
    if (!isStaff) {
      const booking = await this.bookingsService.findOne(payment.booking_id);
      if (booking.customer_id !== user?.customer_id) {
        throw new ForbiddenException(
          'Bạn không có quyền xem giao dịch thanh toán này',
        );
      }
    }
    return payment;
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}