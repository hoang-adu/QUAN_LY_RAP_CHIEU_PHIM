import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ticket } from './ticket.entity';
import { Payment } from '../payments/payment.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { SeatLocksService, Holder } from '../seat-locks/seat-locks.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly dataSource: DataSource,
    private readonly seatLocksService: SeatLocksService,
  ) {}

  // ─────────────────────────────────────────
  // CREATE — Tạo vé mới
  // 2 lớp bảo vệ khỏi race condition (2 người cùng mua 1 ghế 1 lúc):
  //  1) Nghiệp vụ: nếu holder được truyền vào (người đang thực hiện thao
  //     tác) thì kiểm tra ghế không đang bị NGƯỜI KHÁC giữ tạm (seat-lock)
  //     -> chặn sớm với thông báo thân thiện.
  //  2) CSDL: transaction + lock hàng (pessimistic_write) + bắt lỗi
  //     UNIQUE(showtime_id, seat_id) -> lớp phòng thủ cuối cùng, luôn chạy
  //     dù có seat-lock hay không (vd. bán tại quầy không qua bước giữ ghế).
  // Sau khi tạo vé thành công -> nhả seat-lock (nếu có) vì ghế đã bán.
  // ─────────────────────────────────────────
  async create(
    dto: CreateTicketDto,
    holder?: Holder,
    immediatePickup = false,
  ): Promise<Ticket> {
    if (holder) {
      await this.seatLocksService.assertAvailableFor(
        dto.showtime_id,
        dto.seat_id,
        holder,
      );
    }

    // Mọi vé cùng 1 booking (khách đặt nhiều ghế 1 lần) dùng chung 1 mã vé,
    // để khách chỉ cần đưa 1 mã tại quầy là nhận đủ vé cho tất cả ghế.
    const sibling = await this.ticketRepository.findOne({
      where: { booking_id: dto.booking_id },
    });
    const ticketCode = sibling?.ticket_code ?? (await this.generateUniqueCode());

    const ticket = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Ticket);

      // Lock hàng liên quan (nếu có) để 2 request đồng thời không cùng lọt qua
      // bước kiểm tra trước khi insert (giảm race condition, MySQL InnoDB).
      const existing = await repo
        .createQueryBuilder('t')
        .setLock('pessimistic_write')
        .where('t.showtime_id = :showtimeId', { showtimeId: dto.showtime_id })
        .andWhere('t.seat_id = :seatId', { seatId: dto.seat_id })
        .getOne();

      if (existing) {
        throw new BadRequestException(
          `Ghế #${dto.seat_id} đã được đặt cho suất chiếu #${dto.showtime_id}`,
        );
      }

      try {
        // Vé bán tại quầy được nhân viên IN VÀ ĐƯA NGAY cho khách, không có
        // bước "cầm mã vé ra quầy nhận vé sau" như vé online -> đánh dấu
        // is_picked_up ngay lúc tạo để không hiện nhầm "Chưa nhận" mãi mãi
        // trong báo cáo/BookingsPage (khác với vé khách tự đặt online, luôn
        // tạo với is_picked_up=false cho đến khi check-in tại quầy).
        const ticket = repo.create({
          ...dto,
          ticket_code: ticketCode,
          ...(immediatePickup
            ? { is_picked_up: true, picked_up_at: new Date() }
            : {}),
        });
        return await repo.save(ticket);
      } catch (err) {
        // Phòng hờ: nếu vẫn lọt race condition, ràng buộc UNIQUE(showtime_id,
        // seat_id) ở CSDL sẽ chặn insert thứ 2 — bắt lỗi đó và trả thông báo
        // thân thiện thay vì để lộ lỗi SQL thô ra ngoài.
        const code = (err as { code?: string })?.code;
        if (code === 'ER_DUP_ENTRY') {
          throw new BadRequestException(
            `Ghế #${dto.seat_id} vừa được người khác đặt cho suất chiếu #${dto.showtime_id}, vui lòng chọn ghế khác.`,
          );
        }
        throw err;
      }
    });

    // Ghế đã bán -> không cần giữ tạm nữa, nhả lock (nếu có) cho gọn dữ liệu.
    await this.seatLocksService.releaseAfterPurchase(
      dto.showtime_id,
      dto.seat_id,
    );

    return ticket;
  }

  // ─────────────────────────────────────────
  // READ ALL — Lấy danh sách tất cả vé
  // ─────────────────────────────────────────
  async findAll(): Promise<Ticket[]> {
    // DESC: vé vừa bán/vừa đặt hiện lên ĐẦU danh sách thay vì chìm xuống
    // cuối bảng (nhân viên bán vé xong không phải kéo tới trang cuối để
    // xác nhận vé mới tạo).
    return this.ticketRepository.find({
      order: { ticket_id: 'DESC' },
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
  // MÃ VÉ (Phase 3) — sinh mã vé duy nhất, không trùng
  // ─────────────────────────────────────────
  private async generateUniqueCode(): Promise<string> {
    // Bỏ các ký tự dễ nhầm lẫn khi đọc/gõ tay: 0, O, 1, I
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = 'VE-';
      for (let i = 0; i < 6; i++) {
        code += charset[Math.floor(Math.random() * charset.length)];
      }
      const exists = await this.ticketRepository.findOne({
        where: { ticket_code: code },
      });
      if (!exists) return code;
    }
    throw new Error('Không thể sinh mã vé duy nhất, vui lòng thử lại.');
  }

  // ─────────────────────────────────────────
  // READ BY CODE — Lấy tất cả vé có cùng mã vé (cùng 1 booking)
  // ─────────────────────────────────────────
  async findByCode(code: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { ticket_code: code },
      order: { seat_id: 'ASC' },
    });
  }

  async lookupByCode(code: string): Promise<Ticket[]> {
    const tickets = await this.findByCode(code);
    if (tickets.length === 0) {
      throw new NotFoundException(`Không tìm thấy vé nào với mã "${code}"`);
    }
    return tickets;
  }

  // ─────────────────────────────────────────
  // CHECK-IN TẠI QUẦY — khách đưa mã vé, nhân viên xác nhận đã đưa vé thật.
  // Chặn nhận 2 lần cho cùng 1 mã, và CHẶN nếu đơn đặt vé chưa thanh toán
  // thành công (payment_status khác 'paid') — dù khách đã đưa mã vé đúng,
  // vé thật chỉ được in/đưa khi đã có thanh toán 'paid' cho đơn này.
  // ─────────────────────────────────────────
  async checkIn(code: string): Promise<Ticket[]> {
    const tickets = await this.lookupByCode(code);
    const notYetPickedUp = tickets.filter((t) => !t.is_picked_up);

    if (notYetPickedUp.length === 0) {
      const pickedAt = tickets[0]?.picked_up_at;
      throw new BadRequestException(
        `Mã vé "${code}" đã được nhận vé trước đó` +
          (pickedAt ? ` lúc ${new Date(pickedAt).toLocaleString('vi-VN')}` : '') +
          '.',
      );
    }

    const bookingId = tickets[0].booking_id;
    const paidPayment = await this.paymentRepository.findOne({
      where: { booking_id: bookingId, payment_status: 'paid' },
    });
    if (!paidPayment) {
      throw new BadRequestException(
        `Đơn đặt vé #${bookingId} chưa có thanh toán thành công (payment_status = 'paid') — ` +
          'không thể xác nhận đưa vé cho đến khi đơn này được thanh toán đầy đủ.',
      );
    }

    const now = new Date();
    for (const t of notYetPickedUp) {
      t.is_picked_up = true;
      t.picked_up_at = now;
    }
    await this.ticketRepository.save(notYetPickedUp);

    return this.findByCode(code);
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