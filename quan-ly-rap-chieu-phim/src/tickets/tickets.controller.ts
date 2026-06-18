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
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ─────────────────────────────────────────
  // POST /tickets
  // Tạo vé mới
  // Body: { booking_id, showtime_id, seat_id, ticket_price? }
  // ─────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
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
  // PUT /tickets/:id
  // Cập nhật thông tin vé
  // Body: { booking_id?, showtime_id?, seat_id?, ticket_price? }
  // ─────────────────────────────────────────
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, dto);
  }

  // ─────────────────────────────────────────
  // DELETE /tickets/:id
  // Xóa vé theo ID
  // ─────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.remove(id);
  }
}
