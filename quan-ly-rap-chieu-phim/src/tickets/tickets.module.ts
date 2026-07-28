import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { Payment } from '../payments/payment.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { SeatLocksModule } from '../seat-locks/seat-locks.module';

@Module({
  // Payment được thêm vào đây (dùng chung repository với PaymentsModule) để
  // TicketsService kiểm tra đơn đã thanh toán hay chưa trước khi cho check-in.
  imports: [
    TypeOrmModule.forFeature([Ticket, Payment]),
    BookingsModule,
    SeatLocksModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}