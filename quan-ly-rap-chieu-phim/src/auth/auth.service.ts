import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { CustomersService } from '../customers/customers.service';
import { Customer } from '../customers/customer.entity';
import { EmployeesService } from '../employees/employees.service';
import { Employee } from '../employees/employee.entity';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerCustomerDto: RegisterCustomerDto) {
    const { email, phone } = registerCustomerDto;
    const existingCustomer = await this.customersService.findByEmail(email);

    if (existingCustomer) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    if (phone) {
      const existingPhone = await this.customersService.findByPhone(phone);
      if (existingPhone) {
        throw new BadRequestException('Số điện thoại đã được sử dụng');
      }
    }

    const customer = await this.customersService.create(registerCustomerDto);
    return this.toSafeCustomer(customer);
  }

  async validateUser(emailOrPhone: string, password: string) {
    const customer = await this.customersService.findByEmailOrPhone(
      emailOrPhone,
    );
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

  login(
    customer: Pick<
      Customer,
      'customer_id' | 'email' | 'full_name' | 'phone' | 'points'
    >,
  ) {
    const payload = {
      email: customer.email,
      sub: customer.customer_id,
      role: 'customer',
    };
    return {
      access_token: this.jwtService.sign(payload),
      role: 'customer',
      customer_id: customer.customer_id,
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      points: customer.points,
    };
  }

  async validateEmployee(username: string, password: string) {
    const employee = await this.employeesService.findByUsername(username);
    if (!employee || !employee.password) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, employee.password);
    if (!passwordMatches) {
      return null;
    }

    return this.toSafeEmployee(employee);
  }

  private toSafeEmployee(employee: Employee) {
    return {
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      email: employee.email,
      role: employee.role,
      position: employee.position,
    };
  }

  loginEmployee(
    employee: Pick<
      Employee,
      'employee_id' | 'email' | 'role' | 'full_name' | 'position'
    >,
  ) {
    const payload = {
      email: employee.email,
      sub: employee.employee_id,
      role: employee.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      role: employee.role,
      full_name: employee.full_name,
      position: employee.position,
    };
  }
}