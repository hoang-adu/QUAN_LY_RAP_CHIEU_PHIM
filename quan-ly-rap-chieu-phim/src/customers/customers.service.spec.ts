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
  increment: jest.fn(),
});

describe('CustomersService', () => {
  let service: CustomersService;
  let repo: MockRepo<Customer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: createMockRepo(),
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repo = module.get(getRepositoryToken(Customer));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create()', () => {
    it('hash password trước khi lưu', async () => {
      const dto = {
        full_name: 'Nguyễn Văn A',
        email: 'a@gmail.com',
        phone: '0900000000',
        password: 'plain123',
      } as any;

      const entity = { ...dto } as Customer;

      (repo.create as jest.Mock).mockReturnValue(entity);
      (repo.save as jest.Mock).mockImplementation(async (c) => c);

      const result = await service.create(dto);

      expect(result.password).toBeUndefined();

      const savedCustomer = (repo.save as jest.Mock).mock.calls[0][0];

      expect(savedCustomer.password).not.toBe('plain123');

      const matches = await bcrypt.compare(
        'plain123',
        savedCustomer.password,
      );

      expect(matches).toBe(true);
    });

    it('không hash nếu không có password', async () => {
      const dto = {
        full_name: 'Khách',
        email: 'b@gmail.com',
      } as any;

      (repo.create as jest.Mock).mockReturnValue({ ...dto });
      (repo.save as jest.Mock).mockImplementation(async (c) => c);

      const result = await service.create(dto);

      expect(result.password).toBeUndefined();
    });
  });

  describe('findByEmail()', () => {
    it('tìm theo email', async () => {
      const customer = {
        customer_id: 1,
        email: 'a@gmail.com',
      } as Customer;

      (repo.findOne as jest.Mock).mockResolvedValue(customer);

      const result = await service.findByEmail('a@gmail.com');

      expect(result).toEqual(customer);
    });

    it('trả về null nếu không có', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      expect(await service.findByEmail('abc@gmail.com')).toBeNull();
    });
  });

  describe('findOne()', () => {
    it('ném NotFoundException', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(100)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update()', () => {
    it('hash password mới trước khi lưu', async () => {
      const customer = {
        customer_id: 1,
        email: 'a@gmail.com',
        password: 'old_hash',
      } as Customer;

      (repo.findOne as jest.Mock).mockResolvedValue(customer);

      (repo.save as jest.Mock).mockImplementation(async (c) => c);

      const result = await service.update(
        1,
        {
          password: 'newpass123',
        } as any,
      );

      expect(result.password).toBeUndefined();

      const savedCustomer = (repo.save as jest.Mock).mock.calls[0][0];

      expect(savedCustomer.password).not.toBe('old_hash');
      expect(savedCustomer.password).not.toBe('newpass123');

      const matches = await bcrypt.compare(
        'newpass123',
        savedCustomer.password,
      );

      expect(matches).toBe(true);
    });
  });
});
