import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

export interface UpdateCustomerActor {
  role?: string;
}

// Không bao giờ trả field password (dù đã hash) về cho client — API trả
// thẳng entity trước đây vô tình để lộ hash trong response.
function toSafe(customer: Customer): Omit<Customer, 'password'> {
  const { password, ...safe } = customer;
  return safe;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Omit<Customer, 'password'>> {
    const customer = this.customerRepository.create(createCustomerDto);
    if (customer.password) {
      customer.password = await bcrypt.hash(customer.password, 12);
    }
    return toSafe(await this.customerRepository.save(customer));
  }

  async findAll(): Promise<Omit<Customer, 'password'>[]> {
    const customers = await this.customerRepository.find({ order: { customer_id: 'ASC' } });
    return customers.map(toSafe);
  }

  async findOne(id: number): Promise<Omit<Customer, 'password'>> {
    return toSafe(await this.findOneEntity(id));
  }

  // Dùng nội bộ (vd. update() cần password hash gốc để so sánh/giữ nguyên
  // khi không đổi mật khẩu) — KHÔNG expose ra controller.
  private async findOneEntity(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { customer_id: id },
    });
    if (!customer) {
      throw new NotFoundException(`Không tìm thấy khách hàng có id = ${id}`);
    }
    return customer;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { email } });
  }

  async findByEmailOrPhone(emailOrPhone: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { phone } });
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    actor?: UpdateCustomerActor,
  ): Promise<Omit<Customer, 'password'>> {
    const customer = await this.findOneEntity(id);
    const isStaff = actor?.role === 'admin' || actor?.role === 'employee';
    // Khách hàng tự sửa hồ sơ (tên/SĐT/email/mật khẩu) qua route này thì
    // KHÔNG được kèm theo field points — points chỉ được cộng qua checkout
    // (mua vé) hoặc trừ qua đổi voucher, cả 2 đều tự tính trong transaction
    // riêng, không nhận trực tiếp từ client. Chỉ nhân viên/admin (sửa hộ,
    // đối soát) mới được set points trực tiếp qua route này.
    const { points, ...rest } = updateCustomerDto;
    const safeDto = isStaff ? updateCustomerDto : rest;
    Object.assign(customer, safeDto);
    if (updateCustomerDto.password) {
      customer.password = await bcrypt.hash(updateCustomerDto.password, 12);
    }
    return toSafe(await this.customerRepository.save(customer));
  }

  async remove(id: number): Promise<{ message: string }> {
    const customer = await this.findOneEntity(id);
    await this.customerRepository.remove(customer);
    return { message: `Đã xóa khách hàng có id = ${id}` };
  }

  // Cộng điểm tích lũy nguyên tử (UPDATE ... SET points = points + amount)
  // — tránh race condition so với kiểu đọc-rồi-ghi thông thường.
  async addPoints(id: number, amount: number): Promise<void> {
    await this.customerRepository.increment({ customer_id: id }, 'points', amount);
  }
}