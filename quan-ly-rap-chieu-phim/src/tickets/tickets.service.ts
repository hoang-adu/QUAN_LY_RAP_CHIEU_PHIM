import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  // ─────────────────────────────────────────
  // CREATE — Tạo vé mới
  // ─────────────────────────────────────────
  async create(dto: CreateTicketDto): Promise<Ticket> {
    // Kiểm tra vé trùng (cùng suất chiếu + cùng ghế)
    const existing = await this.ticketRepository.findOne({
      where: {
        showtime_id: dto.showtime_id,
        seat_id: dto.seat_id,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Ghế #${dto.seat_id} đã được đặt cho suất chiếu #${dto.showtime_id}`,
      );
    }

    const ticket = this.ticketRepository.create(dto);
    return this.ticketRepository.save(ticket);
  }

  // ─────────────────────────────────────────
  // READ ALL — Lấy danh sách tất cả vé
  // ─────────────────────────────────────────
  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      order: { ticket_id: 'ASC' },
    });
  }

  // ─────────────────────────────────────────
  // READ ONE — Lấy chi tiết 1 vé theo ID
  // ─────────────────────────────────────────
  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticket_id: id },
    });

    if (!ticket) {
      throw new NotFoundException(`Không tìm thấy vé có ID #${id}`);
    }

    return ticket;
  }

  // ─────────────────────────────────────────
  // READ BY BOOKING — Lấy vé theo booking_id
  // ─────────────────────────────────────────
  async findByBooking(bookingId: number): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { booking_id: bookingId },
      order: { ticket_id: 'ASC' },
    });
  }

  // ─────────────────────────────────────────
  // UPDATE — Cập nhật thông tin vé
  // ─────────────────────────────────────────
  async update(id: number, dto: UpdateTicketDto): Promise<Ticket> {
    // Kiểm tra vé tồn tại
    await this.findOne(id);

    // Nếu đổi ghế/suất chiếu → kiểm tra trùng
    if (dto.showtime_id !== undefined || dto.seat_id !== undefined) {
      const current = await this.findOne(id);
      const showtime_id = dto.showtime_id ?? current.showtime_id;
      const seat_id = dto.seat_id ?? current.seat_id;

      const conflict = await this.ticketRepository.findOne({
        where: { showtime_id, seat_id },
      });

      if (conflict && conflict.ticket_id !== id) {
        throw new BadRequestException(
          `Ghế #${seat_id} đã được đặt cho suất chiếu #${showtime_id}`,
        );
      }
    }

    await this.ticketRepository.update(id, dto);
    return this.findOne(id);
  }

  // ─────────────────────────────────────────
  // DELETE — Xóa vé
  // ─────────────────────────────────────────
  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id); // throws 404 nếu không tồn tại
    await this.ticketRepository.delete(id);
    return { message: `Đã xóa vé #${id} thành công` };
  }
}
