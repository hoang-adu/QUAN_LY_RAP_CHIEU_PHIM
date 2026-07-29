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
      // Đơn đã thanh toán ONLINE thành công thì không được hủy ở đây — hủy
      // sẽ nhả ghế miễn phí trong khi tiền khách trả đã thu, tương đương
      // hoàn tiền trá hình, vi phạm đúng quy định "không hoàn tiền vé
      // online". Đơn thanh toán tại quầy hoặc chưa thanh toán vẫn hủy được
      // bình thường.
      const paidOnline = await this.paymentRepository.findOne({
        where: { booking_id: id, payment_status: 'paid', channel: 'online' },
      });
      if (paidOnline) {
        throw new BadRequestException(
          `Đơn #${id} đã thanh toán ONLINE — không thể hủy (không hỗ trợ hoàn tiền). ` +
            'Nếu khách không đến xem, giữ nguyên trạng thái đơn.',
        );
      }
    }

    Object.assign(booking, updateBookingDto);
    const saved = await this.bookingRepository.save(booking);

    if (isCancelling) {
      // Nhả ghế: xóa các dòng vé của đơn này để suất chiếu/ghế đó bán lại
      // được (NewBookingPage/CustomerBookingPage tính ghế "đã bán" dựa trên
      // sự tồn tại của dòng trong bảng tickets).
      await this.ticketRepository.delete({ booking_id: id });

      // Tại đây booking_id KHÔNG còn payment online 'paid' nào (đã chặn ở
      // trên) — payment 'paid' còn lại (nếu có) chắc chắn là thu tại quầy.
      // Đánh dấu 'refunded' để dữ liệu payments phản ánh đúng thực tế: đơn
      // đã hủy thì không thể vẫn hiển thị "đã thanh toán" trên các bảng
      // quản lý (PaymentsPage/BookingsPage), tránh gây hiểu nhầm khi đối
      // soát doanh thu.
      await this.paymentRepository.update(
        { booking_id: id, payment_status: 'paid' },
        { payment_status: 'refunded' },
      );
    }

    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const booking = await this.findOne(id);
    await this.bookingRepository.remove(booking);
    return { message: `Đã xóa đơn đặt vé có id = ${id}` };
  }
}