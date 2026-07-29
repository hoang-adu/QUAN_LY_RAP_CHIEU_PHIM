import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Payment } from '../payments/payment.entity';
import { Booking } from '../bookings/booking.entity';
import { Ticket } from '../tickets/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Booking, Ticket])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
