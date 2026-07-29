import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/payment.entity';
import { Booking } from '../bookings/booking.entity';
import { Ticket } from '../tickets/ticket.entity';

const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  // Doanh thu đã thu (payment_status = 'paid') trong khoảng ngày [from, to],
  // và số đơn theo từng trạng thái (KHÔNG lọc theo ngày — khớp với hành vi
  // cũ của StatsPage.jsx, nơi bookingStatusCounts luôn tính trên toàn bộ
  // bảng bookings bất kể bộ lọc ngày).
  async getOverview(from: string, to: string) {
    const totalRow = await this.paymentRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where("p.payment_status = 'paid'")
      .andWhere('DATE(p.payment_date) BETWEEN :from AND :to', { from, to })
      .getRawOne<{ total: string }>();
    const total = totalRow?.total ?? '0';

    const statusRows = await this.bookingRepository
      .createQueryBuilder('b')
      .select("LOWER(COALESCE(b.status, 'pending'))", 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('status')
      .getRawMany<{ status: string; count: string }>();

    const counts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
    };
    for (const row of statusRows) {
      if ((BOOKING_STATUSES as readonly string[]).includes(row.status)) {
        counts[row.status] = Number(row.count);
      }
    }

    return {
      totalRevenue: Number(total || 0),
      bookingStatusCounts: counts,
    };
  }

  // Doanh thu đã thu theo từng ngày trong khoảng [from, to], đủ cả những
  // ngày không có doanh thu (value = 0) để vẽ biểu đồ liên tục.
  async getRevenueByDay(from: string, to: string) {
    const rows = await this.paymentRepository
      .createQueryBuilder('p')
      .select('DATE(p.payment_date)', 'day')
      .addSelect('SUM(p.amount)', 'total')
      .where("p.payment_status = 'paid'")
      .andWhere('DATE(p.payment_date) BETWEEN :from AND :to', { from, to })
      .groupBy('day')
      .getRawMany<{ day: string | Date; total: string }>();

    const byDay = new Map<string, number>();
    for (const row of rows) {
      const key =
        row.day instanceof Date
          ? row.day.toISOString().slice(0, 10)
          : String(row.day).slice(0, 10);
      byDay.set(key, Number(row.total));
    }

    // Dùng mốc UTC xuyên suốt (parse + tăng ngày + xuất chuỗi đều bằng các
    // hàm getUTC*/setUTCDate) để tránh lệch ngày do timezone của server —
    // parse "T00:00:00" theo giờ LOCAL rồi gọi toISOString() (quy về UTC)
    // sẽ lùi lại 1 ngày ở múi giờ UTC+7 (VN).
    const days: { key: string; value: number }[] = [];
    const cur = new Date(`${from}T00:00:00Z`);
    const end = new Date(`${to}T00:00:00Z`);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      days.push({ key, value: byDay.get(key) || 0 });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
  }

  // Top phim theo số vé bán ra, toàn bộ lịch sử (không lọc ngày — khớp với
  // hành vi cũ của StatsPage.jsx).
  async getTopMovies(limit: number) {
    const rows = await this.ticketRepository
      .createQueryBuilder('t')
      .innerJoin('showtimes', 'st', 'st.showtime_id = t.showtime_id')
      .innerJoin('movies', 'm', 'm.movie_id = st.movie_id')
      .select('m.movie_id', 'movie_id')
      .addSelect('m.title', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('m.movie_id')
      .addGroupBy('m.title')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<{ movie_id: number; name: string; count: string }>();

    return rows.map((r) => ({
      movie_id: r.movie_id,
      name: r.name,
      count: Number(r.count),
    }));
  }
}
