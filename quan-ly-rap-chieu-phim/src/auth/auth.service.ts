import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { CustomersService } from '../customers/customers.service';
import { Customer } from '../customers/customer.entity';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerCustomerDto: RegisterCustomerDto) {
    const { email } = registerCustomerDto;
    const existingCustomer = await this.customersService.findByEmail(email);

    if (existingCustomer) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const customer = await this.customersService.create(registerCustomerDto);
    return this.toSafeCustomer(customer);
  }

  async validateUser(email: string, password: string) {
    const customer = await this.customersService.findByEmail(email);
    if (!customer || !customer.password) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, customer.password);
    if (!passwordMatches) {
      return null;
    }

    return this.toSafeCustomer(customer);
  }

  private toSafeCustomer(customer: Customer) {
    return {
      customer_id: customer.customer_id,
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email,
      points: customer.points,
    };
  }

  login(customer: Pick<Customer, 'customer_id' | 'email'>) {
    const payload = { email: customer.email, sub: customer.customer_id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
