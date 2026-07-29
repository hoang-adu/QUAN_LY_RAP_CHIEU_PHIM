import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BookingsService } from '../bookings/bookings.service';

interface AuthedRequest {
  user: { role?: string; customer_id?: number; employee_id?: number };
}

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly bookingsService: BookingsService,
  ) {}

  // ─────────────────────────────────────────
  // POST /tickets
  // Tạo vé mới
  // Body: { booking_id, showtime_id, seat_id, ticket_price? }
  // Khách hàng chỉ được tạo vé cho booking của chính mình; nhân viên/admin
  // tạo được cho bất kỳ booking nào (bán vé tại quầy).
  // ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTicketDto, @Request() req: AuthedRequest) {
    const user = req.user;
    const isStaff = user?.role === 'admin' || user?.role === 'employee';
    if (!isStaff) {
      const booking = await this.bookingsService.findOne(dto.booking_id);
      if (booking.customer_id !== user?.customer_id) {
        throw new ForbiddenException(
          'Bạn chỉ có thể tạo vé cho đơn đặt vé của chính mình',
        );
      }
    }
    // Truyền "holder" để TicketsService kiểm tra ghế không đang bị NGƯỜI
    // KHÁC giữ tạm (seat-lock) trước khi tạo vé.
    const holder = isStaff
      ? ({ holder_type: 'employee', holder_id: user.employee_id as number } as const)
      : ({ holder_type: 'customer', holder_id: user.customer_id as number } as const);
    // Vé do nhân viên/admin tạo (bán tại quầy) coi như đưa vé thật ngay,
    // không cần bước "nhận vé" riêng như vé khách tự đặt online.
    return this.ticketsService.create(dto, holder, isStaff);
  }

  // ─────────────────────────────────────────
  // GET /tickets
  // Lấy toàn bộ danh sách vé
  // ─────────────────────────────────────────
  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  // ─────────────────────────────────────────
  // GET /tickets/:id
  // Lấy chi tiết 1 vé theo ID
  // ─────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }

  // ─────────────────────────────────────────
  // GET /tickets/booking/:bookingId
  // Lấy tất cả vé của 1 đơn đặt vé
  // ─────────────────────────────────────────
  @Get('booking/:bookingId')
  findByBooking(@Param('bookingId', ParseIntPipe) bookingId: number) {
    return this.ticketsService.findByBooking(bookingId);
  }

  // ─────────────────────────────────────────
  // GET /tickets/lookup/:code
  // Tra cứu vé theo MÃ VÉ (khách đọc mã tại quầy) — chỉ nhân viên/admin,
  // để nhân viên xem trước thông tin (ghế, suất chiếu, đã nhận chưa)
  // trước khi xác nhận đưa vé thật.
  // ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Get('lookup/:code')
  lookupByCode(@Param('code') code: string) {
    return this.ticketsService.lookupByCode(code);
  }

  // ─────────────────────────────────────────
  // POST /tickets/check-in/:code
  // Xác nhận đã đưa vé thật cho khách tại quầy (đối chiếu mã vé) — chỉ
  // nhân viên/admin. Chặn xác nhận 2 lần cho cùng 1 mã vé.
  // ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Post('check-in/:code')
  @HttpCode(HttpStatus.OK)
  checkIn(@Param('code') code: string) {
    return this.ticketsService.checkIn(code);
  }

  // ─────────────────────────────────────────
  // PUT /tickets/:id
  // Cập nhật thông tin vé
  // Body: { booking_id?, showtime_id?, seat_id?, ticket_price? }
  // ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  // ─────────────────────────────────────────
  // DELETE /tickets/:id
  // Xóa vé theo ID — chỉ nhân viên/admin (khách không tự hủy vé đã thanh
  // toán online, đúng yêu cầu "không hoàn tiền").
  // ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.remove(id);
  }
}