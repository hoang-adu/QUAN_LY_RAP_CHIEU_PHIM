import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatLock } from './seat-lock.entity';
import { Ticket } from '../tickets/ticket.entity';
import { SeatLocksService } from './seat-locks.service';
import { SeatLocksController } from './seat-locks.controller';

@Module({
  // Chỉ cần entity Ticket để kiểm tra "ghế đã bán chưa", không import
  // TicketsModule (tránh phụ thuộc vòng vì TicketsModule sẽ import ngược
  // lại SeatLocksModule để kiểm tra lock trước khi tạo vé).
  imports: [TypeOrmModule.forFeature([SeatLock, Ticket])],
  controllers: [SeatLocksController],
  providers: [SeatLocksService],
  exports: [SeatLocksService],
})
export class SeatLocksModule {}
