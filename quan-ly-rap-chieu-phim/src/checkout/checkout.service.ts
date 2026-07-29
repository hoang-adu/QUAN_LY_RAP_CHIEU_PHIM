import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BookingsService } from '../bookings/bookings.service';
import { TicketsService } from '../tickets/tickets.service';
import { PaymentsService } from '../payments/payments.service';
import { CustomersService } from '../customers/customers.service';
import { Ticket } from '../tickets/ticket.entity';
import { Payment } from '../payments/payment.entity';
import { Booking } from '../bookings/booking.entity';
import { Seat } from '../seats/seat.entity';
import { Showtime } from '../showtimes/showtime.entity';
import { TicketPricesService } from '../ticket-prices/ticket-prices.service';
import { CheckoutBookingDto } from './dto/checkout-booking.dto';
import { Holder } from '../seat-locks/seat-locks.service';

// Điểm tích lũy cộng cho khách hàng mỗi khi 1 đơn đặt vé được xác nhận
// (đã thanh toán xong) — áp dụng cho mọi kênh đặt vé, kể cả khi nhân viên
// đặt/thanh toán hộ tại quầy, miễn đơn đó gắn với 1 tài khoản khách hàng.
const BOOKING_LOYALTY_POINTS = 5;

export interface CheckoutActor {
  role?: string;
  customer_id?: number;
  employee_id?: number;
}

// ─────────────────────────────────────────────────────────────────
// CHECKOUT — thay thế luồng cũ mà FE phải tự gọi TUẦN TỰ 3 API riêng
// (POST /bookings -> POST /tickets x N -> POST /payments). Gộp lại thành
// 1 API duy nhất:
//   - Đơn giản hoá phía FE: 1 lần gọi, 1 chỗ xử lý lỗi.
//   - Không còn "đơn mồ côi": nếu tạo vé cho ghế thứ 2 thất bại (vd. vừa bị
//     người khác mua) thì booking + các vé đã tạo trước đó trong lần
//     checkout này sẽ được XOÁ SẠCH (bù trừ/compensate), thay vì để lại
//     1 booking dở dang không ai dọn.
//   - Tự động chuyển trạng thái đơn -> 'confirmed' ngay khi đã thu tiền
//     xong, khỏi cần thêm 1 bước nhân viên bấm "Xác nhận" thủ công nữa.
// ─────────────────────────────────────────────────────────────────
@Injectable()
export class CheckoutService {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly ticketsService: TicketsService,
    private readonly paymentsService: PaymentsService,
    private readonly ticketPricesService: TicketPricesService,
    private readonly customersService: CustomersService,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(Showtime)
    private readonly showtimeRepository: Repository<Showtime>,
  ) {}

  async checkout(
    dto: CheckoutBookingDto,
    actor: CheckoutActor,
  ): Promise<{ booking: Booking; tickets: Ticket[]; payment: Payment | null }> {
    const isStaff = actor.role === 'admin' || actor.role === 'employee';

    // Khách hàng tự đặt: LUÔN lấy customer_id từ token, không tin FE gửi
    // lên (tránh khách sửa request để đặt vé "hộ" người khác).
    if (!isStaff) {
      if (dto.customer_id && Number(dto.customer_id) !== Number(actor.customer_id)) {
        throw new ForbiddenException('Bạn chỉ có thể đặt vé cho chính mình');
      }
    }
    const customerId = isStaff ? dto.customer_id : actor.customer_id;
    if (!customerId) {
      throw new BadRequestException(
        isStaff
          ? 'Vui lòng chọn khách hàng trước khi tạo đơn.'
          : 'Không xác định được tài khoản khách hàng, vui lòng đăng nhập lại.',
      );
    }

    const seatDtos = dto.seats ?? [];
    if (seatDtos.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 ghế.');
    }
    // Không cho chọn trùng 1 ghế 2 lần trong cùng 1 lần đặt.
    const uniqueSeatIds = new Set(seatDtos.map((s) => s.seat_id));
    if (uniqueSeatIds.size !== seatDtos.length) {
      throw new BadRequestException('Danh sách ghế bị trùng, vui lòng kiểm tra lại.');
    }

    // Xác thực suất chiếu tồn tại, và TỰ TÍNH GIÁ VÉ theo seat_type thật
    // trong DB — không tin ticket_price mà client gửi lên (client có thể
    // sửa request để trả giá thấp hơn thực tế).
    const showtime = await this.showtimeRepository.findOne({
      where: { showtime_id: dto.showtime_id },
    });
    if (!showtime) {
      throw new NotFoundException(`Không tìm thấy suất chiếu #${dto.showtime_id}`);
    }

    const seatEntities = await this.seatRepository.findBy({
      seat_id: In(Array.from(uniqueSeatIds)),
    });
    const seatById = new Map(seatEntities.map((s) => [s.seat_id, s]));

    // Lấy TOÀN BỘ bảng giá hiện hành 1 LẦN trước vòng lặp (thay vì gọi lại
    // cho từng ghế) — vừa nhanh hơn, vừa đảm bảo mọi ghế trong CÙNG 1 lần
    // checkout này dùng chung 1 "phiên bản giá" nhất quán, không bị lệch
    // nếu chẳng may admin đổi giá đúng lúc khách đang bấm thanh toán.
    const currentPrices = await this.ticketPricesService.getCurrentPrices();

    const seats: Array<{ seat_id: number; ticket_price: number }> = [];
    for (const s of seatDtos) {
      const seat = seatById.get(s.seat_id);
      if (!seat) {
        throw new BadRequestException(`Không tìm thấy ghế #${s.seat_id}`);
      }
      if (Number(seat.room_id) !== Number(showtime.room_id)) {
        throw new BadRequestException(
          `Ghế #${s.seat_id} không thuộc phòng chiếu của suất chiếu #${dto.showtime_id}`,
        );
      }
      const price =
        seat.seat_type && currentPrices[seat.seat_type] != null
          ? currentPrices[seat.seat_type]
          : currentPrices.standard;
      seats.push({ seat_id: s.seat_id, ticket_price: price });
    }

    const totalAmount = seats.reduce((sum, s) => sum + s.ticket_price, 0);

    const booking = await this.bookingsService.create({
      customer_id: customerId,
      total_amount: totalAmount,
      status: 'pending',
    });

    const holder: Holder = isStaff
      ? { holder_type: 'employee', holder_id: actor.employee_id as number }
      : { holder_type: 'customer', holder_id: actor.customer_id as number };

    const createdTickets: Ticket[] = [];
    try {
      // Tạo vé LẦN LƯỢT cho từng ghế (không song song) để tận dụng đúng cơ
      // chế "dùng chung ticket_code theo booking_id" đã có sẵn trong
      // TicketsService.create — vé đầu tiên sinh mã, các vé sau tự nhận
      // lại đúng mã đó.
      for (const seat of seats) {
        const ticket = await this.ticketsService.create(
          {
            booking_id: booking.booking_id,
            showtime_id: dto.showtime_id,
            seat_id: seat.seat_id,
            ticket_price: seat.ticket_price,
          },
          holder,
          isStaff,
        );
        createdTickets.push(ticket);
      }

      let payment: Payment | null = null;
      const wantsPay = dto.pay !== false; // mặc định thu tiền ngay
      if (wantsPay) {
        payment = await this.paymentsService.create({
          booking_id: booking.booking_id,
          amount: totalAmount,
          payment_method: dto.payment_method || (isStaff ? 'cash' : 'momo'),
          payment_status: 'paid',
          channel: isStaff ? 'counter' : 'online',
        });
      }

      // Đã có đủ vé (+ thanh toán nếu chọn thu ngay) -> tự xác nhận đơn.
      const finalStatus = payment ? 'confirmed' : 'pending';
      const finalBooking = await this.bookingsService.update(booking.booking_id, {
        status: finalStatus,
      });

      // Đơn đã thanh toán/xác nhận xong -> cộng điểm tích lũy cho khách
      // hàng gắn với đơn này (áp dụng cho mọi kênh: khách tự đặt hoặc
      // nhân viên đặt/thu tiền hộ tại quầy).
      if (payment) {
        await this.customersService.addPoints(customerId, BOOKING_LOYALTY_POINTS);
      }

      return { booking: finalBooking, tickets: createdTickets, payment };
    } catch (err) {
      // Lỗi giữa chừng (vd. ghế thứ 2 vừa bị người khác mua) -> dọn sạch
      // booking + vé đã tạo trong lần checkout NÀY, để không có đơn dang dở.
      await this.ticketRepository.delete({ booking_id: booking.booking_id });
      await this.bookingsService.remove(booking.booking_id).catch(() => undefined);
      throw err;
    }
  }
}