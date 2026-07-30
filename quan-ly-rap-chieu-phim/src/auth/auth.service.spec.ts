import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { CustomersService } from '../customers/customers.service';

describe('AuthService', () => {
  let service: AuthService;
  let customersService: Partial<Record<keyof CustomersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  const hashedPassword = bcrypt.hashSync('plain123', 10);

  const existingCustomer = {
    customer_id: 1,
    full_name: 'Nguyễn Văn A',
    email: 'a@gmail.com',
    password: hashedPassword,
  };

  beforeEach(async () => {
    customersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: CustomersService, useValue: customersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register()', () => {
    it('đăng ký thành công khi email chưa tồn tại', async () => {
      (customersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (customersService.create as jest.Mock).mockResolvedValue(existingCustomer);

      const dto = {
        full_name: 'Nguyễn Văn A',
        email: 'a@gmail.com',
        password: 'plain123',
      } as any;

      const result = await service.register(dto);

      expect(customersService.findByEmail).toHaveBeenCalledWith('a@gmail.com');
      expect(customersService.create).toHaveBeenCalledWith(dto);
      expect(result).toBeDefined();
    });

    it('ném ConflictException khi email đã được đăng ký', async () => {
      (customersService.findByEmail as jest.Mock).mockResolvedValue(existingCustomer);

      const dto = { full_name: 'B', email: 'a@gmail.com', password: 'x' } as any;

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(customersService.create).not.toHaveBeenCalled();
    });
  });

  describe('validateUser()', () => {
    it('trả về thông tin khách hàng (không kèm password) khi đăng nhập đúng', async () => {
      (customersService.findByEmail as jest.Mock).mockResolvedValue(existingCustomer);

      const result = await service.validateUser('a@gmail.com', 'plain123');

      expect(result).not.toBeNull();
      expect(result.email).toBe('a@gmail.com');
      expect(result.password).toBeUndefined();
    });

    it('trả về null khi sai mật khẩu', async () => {
      (customersService.findByEmail as jest.Mock).mockResolvedValue(existingCustomer);

      const result = await service.validateUser('a@gmail.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('trả về null khi email không tồn tại', async () => {
      (customersService.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('unknown@gmail.com', 'plain123');

      expect(result).toBeNull();
    });
  });

  describe('login()', () => {
    it('trả về access_token khi đăng nhập thành công', async () => {
      (customersService.findByEmail as jest.Mock).mockResolvedValue(existingCustomer);

      const result = await service.login({
        email: 'a@gmail.com',
        password: 'plain123',
      } as any);

      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token', 'fake-jwt-token');
    });

    it('ném UnauthorizedException khi sai email hoặc mật khẩu', async () => {
      (customersService.findByEmail as jest.Mock).mockResolvedValue(existingCustomer);

      await expect(
        service.login({ email: 'a@gmail.com', password: 'sai-mat-khau' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
