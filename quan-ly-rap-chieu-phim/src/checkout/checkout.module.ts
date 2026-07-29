import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../tickets/ticket.entity';
import { Seat } from '../seats/seat.entity';
import { Showtime } from '../showtimes/showtime.entity';
import { Booking } from '../bookings/booking.entity';
import { Payment } from '../payments/payment.entity';
import { Product } from '../products/product.entity';
import { FoodOrder } from '../food-orders/food-order.entity';
import { FoodOrderDetail } from '../food-orders/food-order-detail.entity';
import { Customer } from '../customers/customer.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { TicketsModule } from '../tickets/tickets.module';
import { PaymentsModule } from '../payments/payments.module';
import { TicketPricesModule } from '../ticket-prices/ticket-prices.module';
import { CustomersModule } from '../customers/customers.module';
import { SeatLocksModule } from '../seat-locks/seat-locks.module';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket, Seat, Showtime, Booking, Payment, Product,
      FoodOrder, FoodOrderDetail, Customer,
    ]),
    BookingsModule,
    TicketsModule,
    PaymentsModule,
    TicketPricesModule,
    CustomersModule,
    SeatLocksModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
