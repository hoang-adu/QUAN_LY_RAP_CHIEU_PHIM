import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { Ticket } from '../tickets/ticket.entity';
import { Payment } from '../payments/payment.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const booking = this.bookingRepository.create(createBookingDto);
    return this.bookingRepository.save(booking);
  }

  async findAll(customerId?: number): Promise<Booking[]> {
    // DESC: đơn vừa tạo hiện lên ĐẦU danh sách, không phải cuối bảng.
    return this.bookingRepository.find({
      where: customerId ? { customer_id: customerId } : {},
      order: { booking_id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { booking_id: id },
    });
    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn đặt vé có id = ${id}`);
    }
    return booking;
  }

  async update(
    id: number,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    const isCancelling =
      updateBookingDto.status === 'cancelled' && booking.status !== 'cancelled';

    if (isCancelling) {
      // Vé đã mua (đã thanh toán) thì KHÔNG được hủy — dù mua online hay
      // thanh toán trực tiếp tại quầy đều không hỗ trợ hoàn trả. Hủy sẽ
      // nhả ghế miễn phí trong khi tiền khách trả đã thu, tương đương hoàn
      // tiền trá hình. Chỉ đơn CHƯA thanh toán mới hủy được.
      const paid = await this.paymentRepository.findOne({
        where: { booking_id: id, payment_status: 'paid' },
      });
      if (paid) {
        throw new BadRequestException(
          `Đơn #${id} đã thanh toán — vé đã mua không được hoàn trả (dù mua online hay tại quầy).`,
        );
      }
    }

    Object.assign(booking, updateBookingDto);
    const saved = await this.bookingRepository.save(booking);

    if (isCancelling) {
      // Nhả ghế: xóa các dòng vé của đơn này để suất chiếu/ghế đó bán lại
      // được (NewBookingPage/CustomerBookingPage tính ghế "đã bán" dựa trên
      // sự tồn tại của dòng trong bảng tickets).
      //
      // Lưu ý: tại đây booking_id chắc chắn KHÔNG có payment 'paid' nào (đã
      // chặn ở trên) — nên không cần bước đánh dấu 'refunded' cho payments
      // nữa, đơn tới được đây nghĩa là chưa hề thu tiền.
      await this.ticketRepository.delete({ booking_id: id });
    }

    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const booking = await this.findOne(id);
    await this.bookingRepository.remove(booking);
    return { message: `Đã xóa đơn đặt vé có id = ${id}` };
  }
}