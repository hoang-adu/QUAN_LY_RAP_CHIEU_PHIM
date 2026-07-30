import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CustomersService } from './customers.service';
import { Customer } from './customer.entity';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepo = (): MockRepo<Customer> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('CustomersService', () => {
  let service: CustomersService;
  let repo: MockRepo<Customer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: createMockRepo() },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repo = module.get(getRepositoryToken(Customer));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create() — mã hóa mật khẩu (yêu cầu bảo mật)', () => {
    it('mã hóa mật khẩu bằng bcrypt trước khi lưu, không lưu plain text', async () => {
      const dto = {
        full_name: 'Nguyễn Văn A',
        email: 'a@gmail.com',
        phone: '0900000000',
        password: 'plain123',
      } as any;

      const createdEntity = { ...dto } as Customer;
      (repo.create as jest.Mock).mockReturnValue(createdEntity);
      (repo.save as jest.Mock).mockImplementation((c) => Promise.resolve(c));

      const result = await service.create(dto);

      // Mật khẩu đã lưu phải khác mật khẩu gốc (đã được hash)
      expect(result.password).not.toBe('plain123');
      // Và phải khớp lại được bằng bcrypt.compare
      const matches = await bcrypt.compare('plain123', result.password);
      expect(matches).toBe(true);
    });

    it('không gọi bcrypt nếu không có mật khẩu trong dto', async () => {
      const dto = { full_name: 'Khách vãng lai', email: 'b@gmail.com' } as any;
      (repo.create as jest.Mock).mockReturnValue({ ...dto });
      (repo.save as jest.Mock).mockImplementation((c) => Promise.resolve(c));

      const result = await service.create(dto);
      expect(result.password).toBeUndefined();
    });
  });

  describe('findByEmail()', () => {
    it('tra cứu khách hàng theo email (phục vụ đăng ký/đăng nhập)', async () => {
      const customer = { customer_id: 1, email: 'a@gmail.com' } as Customer;
      (repo.findOne as jest.Mock).mockResolvedValue(customer);

      const result = await service.findByEmail('a@gmail.com');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@gmail.com' } });
      expect(result).toEqual(customer);
    });

    it('trả về null khi email chưa đăng ký', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.findByEmail('unknown@gmail.com');
      expect(result).toBeNull();
    });
  });

  describe('findOne()', () => {
    it('ném NotFoundException khi khách hàng không tồn tại', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('mã hóa lại mật khẩu mới khi khách hàng đổi mật khẩu', async () => {
      const existing = {
        customer_id: 1,
        email: 'a@gmail.com',
        password: 'old_hashed',
      } as Customer;
      (repo.findOne as jest.Mock).mockResolvedValue(existing);
      (repo.save as jest.Mock).mockImplementation((c) => Promise.resolve(c));

      const result = await service.update(1, { password: 'newpass123' } as any);

      expect(result.password).not.toBe('newpass123');
      expect(result.password).not.toBe('old_hashed');
      const matches = await bcrypt.compare('newpass123', result.password);
      expect(matches).toBe(true);
    });
  });
});
