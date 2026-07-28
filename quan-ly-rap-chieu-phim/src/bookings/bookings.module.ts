import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './booking.entity';
import { Ticket } from '../tickets/ticket.entity';
import { Payment } from '../payments/payment.entity';

// Ticket + Payment được thêm vào đây (KHÔNG import TicketsModule/
// PaymentsModule, vì TicketsModule đã import BookingsModule -> import
// ngược lại sẽ tạo circular dependency). Chỉ cần repository để
// BookingsService tự xử lý "hủy đơn -> nhả ghế" và "chặn hủy đơn đã
// thanh toán online" ngay trong service này.
@Module({
  imports: [TypeOrmModule.forFeature([Booking, Ticket, Payment])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}