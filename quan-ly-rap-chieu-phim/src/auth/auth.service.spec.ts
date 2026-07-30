import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { CustomersService } from '../customers/customers.service';
import { EmployeesService } from '../employees/employees.service';

describe('AuthService', () => {
  let service: AuthService;

  let customersService: {
    findByEmail: jest.Mock;
    findByPhone: jest.Mock;
    findByEmailOrPhone: jest.Mock;
    create: jest.Mock;
  };

  let employeesService: {
    findByUsername: jest.Mock;
  };

  let jwtService: {
    sign: jest.Mock;
  };

  const hashedPassword = bcrypt.hashSync('plain123', 10);

  const customer = {
    customer_id: 1,
    full_name: 'Nguyễn Văn A',
    email: 'a@gmail.com',
    phone: '0123456789',
    password: hashedPassword,
    points: 0,
  };

  const employee = {
    employee_id: 1,
    full_name: 'Admin',
    email: 'admin@gmail.com',
    username: 'admin',
    password: hashedPassword,
    role: 'admin',
    position: 'Manager',
  };

  beforeEach(async () => {
    customersService = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findByEmailOrPhone: jest.fn(),
      create: jest.fn(),
    };

    employeesService = {
      findByUsername: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: CustomersService,
          useValue: customersService,
        },
        {
          provide: EmployeesService,
          useValue: employeesService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('đăng ký thành công', async () => {
      customersService.findByEmail.mockResolvedValue(null);
      customersService.findByPhone.mockResolvedValue(null);
      customersService.create.mockResolvedValue(customer);

      const dto = {
        full_name: 'Nguyễn Văn A',
        email: 'a@gmail.com',
        phone: '0123456789',
        password: 'plain123',
      };

      const result = await service.register(dto as any);

      expect(customersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(customersService.findByPhone).toHaveBeenCalledWith(dto.phone);
      expect(customersService.create).toHaveBeenCalledWith(dto);

      expect(result).toEqual({
        customer_id: 1,
        full_name: 'Nguyễn Văn A',
        email: 'a@gmail.com',
        phone: '0123456789',
        points: 0,
      });
    });

    it('ném BadRequestException nếu email đã tồn tại', async () => {
      customersService.findByEmail.mockResolvedValue(customer);

      await expect(
        service.register({
          full_name: 'A',
          email: 'a@gmail.com',
          password: '123',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException nếu số điện thoại đã tồn tại', async () => {
      customersService.findByEmail.mockResolvedValue(null);
      customersService.findByPhone.mockResolvedValue(customer);

      await expect(
        service.register({
          full_name: 'A',
          email: 'new@gmail.com',
          phone: '0123456789',
          password: '123',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateUser()', () => {
    it('trả về customer nếu đăng nhập đúng', async () => {
      customersService.findByEmailOrPhone.mockResolvedValue(customer);

      const result = await service.validateUser(
        'a@gmail.com',
        'plain123',
      );

      expect(result).toEqual({
        customer_id: 1,
        full_name: 'Nguyễn Văn A',
        email: 'a@gmail.com',
        phone: '0123456789',
        points: 0,
      });
    });

    it('trả về null nếu sai mật khẩu', async () => {
      customersService.findByEmailOrPhone.mockResolvedValue(customer);

      const result = await service.validateUser(
        'a@gmail.com',
        'wrong-password',
      );

      expect(result).toBeNull();
    });

    it('trả về null nếu không tìm thấy user', async () => {
      customersService.findByEmailOrPhone.mockResolvedValue(null);

      const result = await service.validateUser(
        'abc@gmail.com',
        '123456',
      );

      expect(result).toBeNull();
    });
  });

  describe('login()', () => {
    it('tạo access token cho customer', () => {
      const result = service.login({
        customer_id: 1,
        full_name: 'Nguyễn Văn A',
        email: 'a@gmail.com',
        phone: '0123456789',
        points: 0,
      });

      expect(jwtService.sign).toHaveBeenCalled();

      expect(result).toEqual({
        access_token: 'fake-jwt-token',
        role: 'customer',
        customer_id: 1,
        full_name: 'Nguyễn Văn A',
        email: 'a@gmail.com',
        phone: '0123456789',
        points: 0,
      });
    });
  });

  describe('validateEmployee()', () => {
    it('trả về employee khi đăng nhập đúng', async () => {
      employeesService.findByUsername.mockResolvedValue(employee);

      const result = await service.validateEmployee(
        'admin',
        'plain123',
      );

      expect(result).toEqual({
        employee_id: 1,
        full_name: 'Admin',
        email: 'admin@gmail.com',
        role: 'admin',
        position: 'Manager',
      });
    });

    it('trả về null nếu sai mật khẩu', async () => {
      employeesService.findByUsername.mockResolvedValue(employee);

      const result = await service.validateEmployee(
        'admin',
        'wrong',
      );

      expect(result).toBeNull();
    });

    it('trả về null nếu không tìm thấy employee', async () => {
      employeesService.findByUsername.mockResolvedValue(null);

      const result = await service.validateEmployee(
        'admin',
        'plain123',
      );

      expect(result).toBeNull();
    });
  });

  describe('loginEmployee()', () => {
    it('tạo access token cho employee', () => {
      const result = service.loginEmployee({
        employee_id: 1,
        email: 'admin@gmail.com',
        role: 'admin',
        full_name: 'Admin',
        position: 'Manager',
      });

      expect(jwtService.sign).toHaveBeenCalled();

      expect(result).toEqual({
        access_token: 'fake-jwt-token',
        role: 'admin',
        full_name: 'Admin',
        position: 'Manager',
      });
    });
  });
});
  
