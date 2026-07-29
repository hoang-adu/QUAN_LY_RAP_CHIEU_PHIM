import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Ticket } from '../tickets/ticket.entity';
import { Payment } from '../payments/payment.entity';
import { Booking } from '../bookings/booking.entity';
import { Seat } from '../seats/seat.entity';
import { Showtime } from '../showtimes/showtime.entity';
import { Product } from '../products/product.entity';
import { FoodOrder } from '../food-orders/food-order.entity';
import { FoodOrderDetail } from '../food-orders/food-order-detail.entity';
import { Customer } from '../customers/customer.entity';
import { TicketPricesService } from '../ticket-prices/ticket-prices.service';
import { CheckoutBookingDto } from './dto/checkout-booking.dto';
import { Holder, SeatLocksService } from '../seat-locks/seat-locks.service';

const BOOKING_LOYALTY_POINTS = 5;

export interface CheckoutActor {
  role?: string;
  customer_id?: number;
  employee_id?: number;
}

export interface CheckoutResult {
  booking: Booking;
  tickets: Ticket[];
  payment: Payment | null;
  food_order: FoodOrder | null;
  food_details: FoodOrderDetail[];
  ticket_total: number;
  food_total: number;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ticketPricesService: TicketPricesService,
    private readonly seatLocksService: SeatLocksService,
    @InjectRepository(Seat) private readonly seatRepository: Repository<Seat>,
    @InjectRepository(Showtime) private readonly showtimeRepository: Repository<Showtime>,
  ) {}

  private async generateTicketCode(manager: any): Promise<string> {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = 'VE-';
      for (let i = 0; i < 6; i++) code += charset[Math.floor(Math.random() * charset.length)];
      const exists = await manager.getRepository(Ticket).findOne({ where: { ticket_code: code } });
      if (!exists) return code;
    }
    throw new BadRequestException('Không thể sinh mã vé, vui lòng thử lại.');
  }

  async checkout(dto: CheckoutBookingDto, actor: CheckoutActor): Promise<CheckoutResult> {
    const isStaff = actor.role === 'admin' || actor.role === 'employee';
    if (!isStaff && dto.customer_id && Number(dto.customer_id) !== Number(actor.customer_id)) {
      throw new ForbiddenException('Bạn chỉ có thể đặt vé cho chính mình');
    }
    const customerId = isStaff ? dto.customer_id : actor.customer_id;
    if (!customerId) throw new BadRequestException('Không xác định được khách hàng.');

    const seatDtos = dto.seats ?? [];
    if (!seatDtos.length) throw new BadRequestException('Vui lòng chọn ít nhất 1 ghế.');
    const uniqueSeatIds = [...new Set(seatDtos.map((s) => Number(s.seat_id)))];
    if (uniqueSeatIds.length !== seatDtos.length) throw new BadRequestException('Danh sách ghế bị trùng.');

    const foodItems = dto.food_items ?? [];
    const mergedFood = new Map<number, number>();
    for (const item of foodItems) {
      mergedFood.set(Number(item.product_id), (mergedFood.get(Number(item.product_id)) ?? 0) + Number(item.quantity));
    }

    const showtime = await this.showtimeRepository.findOne({ where: { showtime_id: dto.showtime_id } });
    if (!showtime) throw new NotFoundException(`Không tìm thấy suất chiếu #${dto.showtime_id}`);
    const seatEntities = await this.seatRepository.findBy({ seat_id: In(uniqueSeatIds) });
    const seatById = new Map(seatEntities.map((s) => [Number(s.seat_id), s]));
    const currentPrices = await this.ticketPricesService.getCurrentPrices();
    const seats = uniqueSeatIds.map((seatId) => {
      const seat = seatById.get(seatId);
      if (!seat) throw new BadRequestException(`Không tìm thấy ghế #${seatId}`);
      if (Number(seat.room_id) !== Number(showtime.room_id)) {
        throw new BadRequestException(`Ghế #${seatId} không thuộc phòng của suất chiếu.`);
      }
      const price = Number(currentPrices[seat.seat_type] ?? currentPrices.standard);
      return { seat_id: seatId, ticket_price: price };
    });

    const holder: Holder = isStaff
      ? { holder_type: 'employee', holder_id: Number(actor.employee_id) }
      : { holder_type: 'customer', holder_id: Number(actor.customer_id) };
    for (const seat of seats) {
      await this.seatLocksService.assertAvailableFor(dto.showtime_id, seat.seat_id, holder);
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const ticketRepo = manager.getRepository(Ticket);
      const paymentRepo = manager.getRepository(Payment);
      const productRepo = manager.getRepository(Product);
      const foodOrderRepo = manager.getRepository(FoodOrder);
      const detailRepo = manager.getRepository(FoodOrderDetail);
      const customerRepo = manager.getRepository(Customer);

      const customer = await customerRepo.findOne({ where: { customer_id: Number(customerId) } });
      if (!customer) throw new NotFoundException(`Không tìm thấy khách hàng #${customerId}`);

      for (const seat of seats) {
        const existing = await ticketRepo.createQueryBuilder('t')
          .setLock('pessimistic_write')
          .where('t.showtime_id = :showtimeId', { showtimeId: dto.showtime_id })
          .andWhere('t.seat_id = :seatId', { seatId: seat.seat_id })
          .getOne();
        if (existing) throw new BadRequestException(`Ghế #${seat.seat_id} đã được đặt.`);
      }

      const productRows: Product[] = [];
      for (const [productId, quantity] of mergedFood) {
        const product = await productRepo.createQueryBuilder('p')
          .setLock('pessimistic_write')
          .where('p.product_id = :productId', { productId })
          .getOne();
        if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm #${productId}`);
        if (Number(product.stock_quantity ?? 0) < quantity) {
          throw new BadRequestException(`${product.product_name} chỉ còn ${product.stock_quantity ?? 0} sản phẩm.`);
        }
        productRows.push(product);
      }

      const ticketTotal = seats.reduce((sum, s) => sum + Number(s.ticket_price), 0);
      const foodTotal = productRows.reduce(
        (sum, p) => sum + Number(p.price) * Number(mergedFood.get(Number(p.product_id))), 0,
      );
      const grandTotal = ticketTotal + foodTotal;

      let booking = await bookingRepo.save(bookingRepo.create({
        customer_id: Number(customerId), total_amount: grandTotal, status: 'pending',
      }));
      const ticketCode = await this.generateTicketCode(manager);
      const tickets = await ticketRepo.save(seats.map((seat) => ticketRepo.create({
        booking_id: booking.booking_id,
        showtime_id: dto.showtime_id,
        seat_id: seat.seat_id,
        ticket_price: seat.ticket_price,
        ticket_code: ticketCode,
        is_picked_up: isStaff,
        picked_up_at: isStaff ? new Date() : null,
      })));

      let foodOrder: FoodOrder | null = null;
      let foodDetails: FoodOrderDetail[] = [];
      if (productRows.length) {
        foodOrder = await foodOrderRepo.save(foodOrderRepo.create({
          booking_id: booking.booking_id,
          customer_id: Number(customerId),
          total_amount: foodTotal,
          status: dto.pay === false ? 'pending' : 'paid',
        }));
        foodDetails = await detailRepo.save(productRows.map((product) => detailRepo.create({
          order_id: foodOrder!.order_id,
          product_id: product.product_id,
          quantity: Number(mergedFood.get(Number(product.product_id))),
          unit_price: Number(product.price),
        })));
        for (const product of productRows) {
          product.stock_quantity = Number(product.stock_quantity) - Number(mergedFood.get(Number(product.product_id)));
        }
        await productRepo.save(productRows);
      }

      let payment: Payment | null = null;
      if (dto.pay !== false) {
        payment = await paymentRepo.save(paymentRepo.create({
          booking_id: booking.booking_id,
          amount: grandTotal,
          payment_method: dto.payment_method || (isStaff ? 'cash' : 'momo'),
          payment_status: 'paid',
          channel: isStaff ? 'counter' : 'online',
        }));
        booking.status = 'confirmed';
        booking = await bookingRepo.save(booking);
        customer.points = Number(customer.points ?? 0) + BOOKING_LOYALTY_POINTS;
        await customerRepo.save(customer);
      }

      return { booking, tickets, payment, food_order: foodOrder, food_details: foodDetails, ticket_total: ticketTotal, food_total: foodTotal };
    });

    await Promise.all(seats.map((s) => this.seatLocksService.releaseAfterPurchase(dto.showtime_id, s.seat_id)));
    return result;
  }
}
