import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { SeatLocksModule } from '../seat-locks/seat-locks.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), BookingsModule, SeatLocksModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}