import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
    if (customer.password) {
      customer.password = await bcrypt.hash(customer.password, 12);
    }
    return this.customerRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find({ order: { customer_id: 'ASC' } });
  }

  async findOne(id: number): Promise<Customer> {
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
  ): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    if (updateCustomerDto.password) {
      customer.password = await bcrypt.hash(updateCustomerDto.password, 12);
    }
    return this.customerRepository.save(customer);
  }

  async remove(id: number): Promise<{ message: string }> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
    return { message: `Đã xóa khách hàng có id = ${id}` };
  }

  // Cộng điểm tích lũy nguyên tử (UPDATE ... SET points = points + amount)
  // — tránh race condition so với kiểu đọc-rồi-ghi thông thường.
  async addPoints(id: number, amount: number): Promise<void> {
    await this.customerRepository.increment({ customer_id: id }, 'points', amount);
  }
}