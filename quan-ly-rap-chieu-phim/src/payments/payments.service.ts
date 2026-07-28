import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentRepository.create(createPaymentDto);
    return this.paymentRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    // DESC: thanh toán vừa thu hiện lên ĐẦU danh sách thay vì chìm xuống
    // cuối bảng (nhân viên thu tiền xong không phải kéo tới trang cuối để
    // xác nhận vừa ghi nhận đúng giao dịch).
    return this.paymentRepository.find({ order: { payment_id: 'DESC' } });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { payment_id: id },
    });
    if (!payment) {
      throw new NotFoundException(`Không tìm thấy thanh toán có id = ${id}`);
    }
    return payment;
  }

  // Thanh toán ONLINE đã 'paid' KHÔNG được sửa (đổi trạng thái, đổi số
  // tiền...) theo đúng nghiệp vụ "vé đặt+thanh toán online không hoàn
  // tiền". Thanh toán tại quầy (channel='counter') hoặc thanh toán online
  // chưa 'paid' vẫn sửa bình thường (vd. đánh dấu 'failed' khi cổng thanh
  // toán báo lỗi trước khi khách trả xong).
  private assertEditable(payment: Payment) {
    if (payment.channel === 'online' && payment.payment_status === 'paid') {
      throw new BadRequestException(
        `Thanh toán #${payment.payment_id} là thanh toán ONLINE đã hoàn tất — ` +
          'không được sửa hoặc hoàn tiền theo quy định.',
      );
    }
  }

  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.findOne(id);
    this.assertEditable(payment);
    // channel không cho sửa qua API update (chỉ gán 1 lần lúc tạo).
    const { channel, ...safeDto } = updatePaymentDto as UpdatePaymentDto & {
      channel?: unknown;
    };
    Object.assign(payment, safeDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: number): Promise<{ message: string }> {
    const payment = await this.findOne(id);
    this.assertEditable(payment);
    await this.paymentRepository.remove(payment);
    return { message: `Đã xóa thanh toán có id = ${id}` };
  }
}