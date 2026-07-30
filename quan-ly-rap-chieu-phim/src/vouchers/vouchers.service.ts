import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Voucher } from './voucher.entity';
import { Customer } from '../customers/customer.entity';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';
import {
  MIN_REDEEM_POINTS,
  REDEEM_POINTS_STEP,
  VOUCHER_EXPIRY_DAYS,
  VOUCHER_VALUE_PER_POINT,
} from './vouchers.constants';

@Injectable()
export class VouchersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
  ) {}

  // Sinh mã voucher ngẫu nhiên dạng "GG-XXXXXX", đảm bảo không trùng.
  async generateCode(manager: EntityManager): Promise<string> {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = 'GG-';
      for (let i = 0; i < 6; i++) code += charset[Math.floor(Math.random() * charset.length)];
      const exists = await manager.getRepository(Voucher).findOne({ where: { code } });
      if (!exists) return code;
    }
    throw new BadRequestException('Không thể sinh mã voucher, vui lòng thử lại.');
  }

  // Đánh dấu 'expired' cho các voucher 'unused' đã quá hạn — chạy trước mỗi
  // lần liệt kê để danh sách trả về luôn phản ánh đúng trạng thái hiện tại.
  private async expireOutdated(): Promise<void> {
    await this.voucherRepository
      .createQueryBuilder()
      .update(Voucher)
      .set({ status: 'expired' })
      .where('status = :unused', { unused: 'unused' })
      .andWhere('expires_at IS NOT NULL AND expires_at < :now', { now: new Date() })
      .execute();
  }

  // Đổi điểm tích lũy của khách hàng lấy 1 voucher giảm giá. Trừ điểm và
  // tạo voucher trong cùng 1 transaction, khóa dòng khách hàng để tránh
  // race condition khi đổi điểm nhiều lần liên tiếp.
  async redeem(customerId: number, dto: RedeemVoucherDto): Promise<Voucher> {
    const points = Number(dto.points);
    if (points < MIN_REDEEM_POINTS) {
      throw new BadRequestException(`Số điểm đổi tối thiểu là ${MIN_REDEEM_POINTS} điểm.`);
    }
    if (points % REDEEM_POINTS_STEP !== 0) {
      throw new BadRequestException(`Số điểm đổi phải là bội số của ${REDEEM_POINTS_STEP}.`);
    }

    return this.dataSource.transaction(async (manager) => {
      const customerRepo = manager.getRepository(Customer);
      const voucherRepo = manager.getRepository(Voucher);

      const customer = await customerRepo
        .createQueryBuilder('c')
        .setLock('pessimistic_write')
        .where('c.customer_id = :id', { id: customerId })
        .getOne();
      if (!customer) throw new NotFoundException('Không tìm thấy khách hàng.');
      if (Number(customer.points ?? 0) < points) {
        throw new BadRequestException('Số điểm hiện có không đủ để đổi voucher.');
      }

      customer.points = Number(customer.points ?? 0) - points;
      await customerRepo.save(customer);

      const code = await this.generateCode(manager);
      const voucher = voucherRepo.create({
        customer_id: customerId,
        code,
        points_used: points,
        discount_amount: points * VOUCHER_VALUE_PER_POINT,
        status: 'unused',
        expires_at: new Date(Date.now() + VOUCHER_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      });
      return voucherRepo.save(voucher);
    });
  }

  // Danh sách voucher của chính khách hàng (dùng cho trang "Ưu đãi của tôi").
  async findMine(customerId: number): Promise<Voucher[]> {
    await this.expireOutdated();
    return this.voucherRepository.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
    });
  }

  // Danh sách toàn bộ voucher — dùng cho admin/nhân viên đối soát.
  async findAll(customerId?: number): Promise<Voucher[]> {
    await this.expireOutdated();
    return this.voucherRepository.find({
      where: customerId ? { customer_id: customerId } : {},
      order: { created_at: 'DESC' },
    });
  }
}