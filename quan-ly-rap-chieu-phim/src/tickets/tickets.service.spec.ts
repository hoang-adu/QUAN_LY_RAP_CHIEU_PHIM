import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TicketsService } from './tickets.service';
import { Ticket } from './ticket.entity';
import { Payment } from '../payments/payment.entity';
import { SeatLocksService } from '../seat-locks/seat-locks.service';

// Repository giả lập cho Ticket / Payment — không đụng tới CSDL thật.
const createMockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((dto) => dto),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

// Query builder giả lập cho các bước .setLock().where().andWhere().getOne()
// dùng bên trong transaction của create()/update()/remove().
const createMockQueryBuilder = (resolvedValue: any) => ({
  setLock: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(resolvedValue),
});

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketRepository: ReturnType<typeof createMockRepository>;
  let paymentRepository: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };
  let seatLocksService: Partial<SeatLocksService>;

  beforeEach(async () => {
    ticketRepository = createMockRepository();
    paymentRepository = createMockRepository();
    dataSource = { transaction: jest.fn() };
    seatLocksService = {
      assertAvailableFor: jest.fn().mockResolvedValue(undefined),
      releaseAfterPurchase: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Ticket), useValue: ticketRepository },
        { provide: getRepositoryToken(Payment), useValue: paymentRepository },
        { provide: DataSource, useValue: dataSource },
        { provide: SeatLocksService, useValue: seatLocksService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── 1. findOne ──────────────────────────────────────────────
  it('findOne: trả về vé khi tìm thấy', async () => {
    const ticket = { ticket_id: 1, seat_id: 5 } as Ticket;
    ticketRepository.findOne.mockResolvedValue(ticket);

    await expect(service.findOne(1)).resolves.toEqual(ticket);
    expect(ticketRepository.findOne).toHaveBeenCalledWith({
      where: { ticket_id: 1 },
    });
  });

  // ── 2. findOne — not found ──────────────────────────────────
  it('findOne: ném NotFoundException khi không tìm thấy vé', async () => {
    ticketRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  // ── 3. findAll ───────────────────────────────────────────────
  it('findAll: sắp xếp vé mới nhất lên đầu (ticket_id DESC)', async () => {
    ticketRepository.find.mockResolvedValue([]);
    await service.findAll();
    expect(ticketRepository.find).toHaveBeenCalledWith({
      order: { ticket_id: 'DESC' },
    });
  });

  // ── 4. findByBooking ─────────────────────────────────────────
  it('findByBooking: lọc đúng theo booking_id, sắp theo seat_id ASC', async () => {
    ticketRepository.find.mockResolvedValue([{ ticket_id: 1, booking_id: 7 }]);
    const result = await service.findByBooking(7);
    expect(ticketRepository.find).toHaveBeenCalledWith({
      where: { booking_id: 7 },
      order: { ticket_id: 'ASC' },
    });
    expect(result).toHaveLength(1);
  });

  // ── 5. findByCode ────────────────────────────────────────────
  it('findByCode: trả về mọi vé cùng mã (cùng 1 booking)', async () => {
    ticketRepository.find.mockResolvedValue([
      { ticket_id: 1, ticket_code: 'VE-ABC123' },
      { ticket_id: 2, ticket_code: 'VE-ABC123' },
    ]);
    const result = await service.findByCode('VE-ABC123');
    expect(result).toHaveLength(2);
  });

  // ── 6. lookupByCode — not found ─────────────────────────────
  it('lookupByCode: ném NotFoundException nếu mã vé không tồn tại', async () => {
    ticketRepository.find.mockResolvedValue([]);
    await expect(service.lookupByCode('VE-XXXXXX')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ── 7. checkIn — đã nhận vé trước đó ────────────────────────
  it('checkIn: từ chối nếu mã vé đã được nhận trước đó', async () => {
    ticketRepository.find.mockResolvedValue([
      { ticket_id: 1, ticket_code: 'VE-ABC123', is_picked_up: true, picked_up_at: new Date() },
    ]);
    await expect(service.checkIn('VE-ABC123')).rejects.toThrow(
      BadRequestException,
    );
  });

  // ── 8. checkIn — đơn chưa thanh toán ────────────────────────
  it('checkIn: từ chối nếu đơn đặt vé chưa có thanh toán "paid"', async () => {
    ticketRepository.find.mockResolvedValue([
      { ticket_id: 1, booking_id: 10, ticket_code: 'VE-ABC123', is_picked_up: false },
    ]);
    paymentRepository.findOne.mockResolvedValue(null); // chưa có payment 'paid'

    await expect(service.checkIn('VE-ABC123')).rejects.toThrow(
      BadRequestException,
    );
  });

  // ── 9. checkIn — thành công ─────────────────────────────────
  it('checkIn: đánh dấu is_picked_up = true khi đơn đã thanh toán', async () => {
    const tickets = [
      { ticket_id: 1, booking_id: 10, ticket_code: 'VE-ABC123', is_picked_up: false },
    ];
    ticketRepository.find.mockResolvedValue(tickets);
    paymentRepository.findOne.mockResolvedValue({ payment_status: 'paid' });
    ticketRepository.save.mockResolvedValue(tickets);

    await service.checkIn('VE-ABC123');

    expect(ticketRepository.save).toHaveBeenCalled();
    expect(tickets[0].is_picked_up).toBe(true);
  });

  // ── 10. create — ghế đã có người đặt (chặn trùng ghế) ───────
  it('create: ném BadRequestException nếu ghế đã được đặt cho suất chiếu này', async () => {
    ticketRepository.findOne.mockResolvedValue(null); // không có vé "sibling" cùng booking

    const mockManagerRepo = {
      ...createMockRepository(),
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(createMockQueryBuilder({ ticket_id: 99 })), // ghế đã bị bán
    };
    dataSource.transaction.mockImplementation(async (cb: any) =>
      cb({ getRepository: () => mockManagerRepo }),
    );

    await expect(
      service.create({ showtime_id: 1, seat_id: 5, booking_id: 1 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  // ── 11. update — chặn sửa khi đơn đã thanh toán ─────────────
  it('update: ném BadRequestException nếu đơn đã thanh toán (paid)', async () => {
    const mockManagerRepos: Record<string, any> = {
      Ticket: { findOne: jest.fn().mockResolvedValue({ ticket_id: 1, booking_id: 10 }) },
      Payment: { findOne: jest.fn().mockResolvedValue({ payment_status: 'paid' }) },
    };
    dataSource.transaction.mockImplementation(async (cb: any) =>
      cb({
        getRepository: (entity: any) =>
          mockManagerRepos[entity.name] ?? createMockRepository(),
      }),
    );

    await expect(service.update(1, { seat_id: 6 } as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  // ── 12. remove — chặn xóa khi đơn đã thanh toán ─────────────
  it('remove: ném BadRequestException nếu đơn đã thanh toán (paid)', async () => {
    const mockManagerRepos: Record<string, any> = {
      Ticket: { findOne: jest.fn().mockResolvedValue({ ticket_id: 1, booking_id: 10 }) },
      Payment: { findOne: jest.fn().mockResolvedValue({ payment_status: 'paid' }) },
    };
    dataSource.transaction.mockImplementation(async (cb: any) =>
      cb({
        getRepository: (entity: any) =>
          mockManagerRepos[entity.name] ?? createMockRepository(),
      }),
    );

    await expect(service.remove(1)).rejects.toThrow(BadRequestException);
  });
});
