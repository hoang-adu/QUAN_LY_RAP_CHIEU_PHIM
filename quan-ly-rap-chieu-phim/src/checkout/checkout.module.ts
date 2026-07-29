import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../tickets/ticket.entity';
import { Seat } from '../seats/seat.entity';
import { Showtime } from '../showtimes/showtime.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { TicketsModule } from '../tickets/tickets.module';
import { PaymentsModule } from '../payments/payments.module';
import { TicketPricesModule } from '../ticket-prices/ticket-prices.module';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';

// LƯU Ý phụ thuộc module: BookingsModule KHÔNG được import TicketsModule/
// PaymentsModule (2 module đó đã import ngược lại BookingsModule). Vì vậy
// logic "gộp 3 bước" này phải nằm ở 1 module riêng (CheckoutModule) đứng
// trên cả 3, thay vì nhét vào BookingsModule — tránh circular dependency.
@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Seat, Showtime]),
    BookingsModule,
    TicketsModule,
    PaymentsModule,
    TicketPricesModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
