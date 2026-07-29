import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TicketPrice } from './ticket-price.entity';
import { CreateTicketPriceDto } from './dto/create-ticket-price.dto';
import { DEFAULT_SEAT_PRICES, SEAT_TYPES } from './ticket-prices.constants';

@Injectable()
export class TicketPricesService implements OnModuleInit {
  private readonly logger = new Logger(TicketPricesService.name);

  constructor(
    @InjectRepository(TicketPrice)
    private readonly repo: Repository<TicketPrice>,
  ) {}

  // Seed giá mặc định NẾU bảng còn trống (nâng cấp lần đầu) — giữ nguyên
  // hành vi giá cũ (hardcode) trước đây, sau đó mọi thay đổi đi qua API.
  async onModuleInit() {
    const count = await this.repo.count();
    if (count > 0) return;

    this.logger.log('Bảng ticket_prices trống — seed giá mặc định lần đầu.');
    const rows = SEAT_TYPES.map((seat_type) =>
      this.repo.create({
        seat_type,
        price: DEFAULT_SEAT_PRICES[seat_type],
        note: 'Giá khởi tạo (seed tự động)',
        changed_by: null,
      }),
    );
    await this.repo.save(rows);
  }

  // ─────────────────────────────────────────
  // GIÁ HIỆN TẠI của tất cả loại ghế — mỗi seat_type lấy dòng có
  // created_at MỚI NHẤT (đây chính là "giá đang áp dụng").
  // ─────────────────────────────────────────
  async getCurrentPrices(): Promise<Record<string, number>> {
    // Subquery: với mỗi seat_type, tìm created_at lớn nhất; rồi join lại
    // để lấy đúng dòng (price) tương ứng — xử lý đúng cả khi 2 lần đổi
    // giá xảy ra trong cùng 1 mili-giây (hiếm nhưng an toàn hơn).
    const latestIds = await this.repo
      .createQueryBuilder('tp')
      .select('tp.seat_type', 'seat_type')
      .addSelect('MAX(tp.price_id)', 'price_id')
      .groupBy('tp.seat_type')
      .getRawMany<{ seat_type: string; price_id: number }>();

    if (latestIds.length === 0) return { ...DEFAULT_SEAT_PRICES };

    const ids = latestIds.map((r) => r.price_id);
    const rows = await this.repo.findBy({ price_id: In(ids) });

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.seat_type] = Number(row.price);
    }
    return result;
  }

  // Giá hiện tại của 1 loại ghế cụ thể — dùng ngay lúc checkout để tính
  // tiền vé. Nếu seat_type lạ chưa từng được cấu hình giá -> fallback
  // giá 'standard' hiện tại (không bao giờ để 1 ghế bị tính giá 0đ).
  async getCurrentPrice(seatType?: string | null): Promise<number> {
    const prices = await this.getCurrentPrices();
    if (seatType && prices[seatType] != null) return prices[seatType];
    return prices.standard ?? DEFAULT_SEAT_PRICES.standard;
  }

  // ─────────────────────────────────────────
  // LỊCH SỬ giá — phục vụ trang quản lý (xem đã đổi giá bao nhiêu lần,
  // ai đổi, lúc nào). Không lọc theo ngày hiệu lực vì vé cũ đã snapshot
  // giá riêng, lịch sử này chỉ mang tính đối soát/tham khảo.
  // ─────────────────────────────────────────
  async getHistory(seatType?: string): Promise<TicketPrice[]> {
    return this.repo.find({
      where: seatType ? { seat_type: seatType } : {},
      order: { created_at: 'DESC', price_id: 'DESC' },
    });
  }

  // ─────────────────────────────────────────
  // ĐỔI GIÁ — KHÔNG UPDATE dòng cũ, luôn INSERT dòng mới. Đây là điểm
  // mấu chốt để "đổi giá nhiều lần trong tương lai không ảnh hưởng gì":
  // giá mới có hiệu lực NGAY LẬP TỨC cho các đơn đặt vé TỪ THỜI ĐIỂM NÀY
  // trở đi (vì checkout luôn gọi getCurrentPrice() tại thời điểm đặt),
  // còn các vé đã bán trước đó vẫn giữ ticket_price đã lưu sẵn trong
  // bảng tickets — hoàn toàn không đọc lại bảng ticket_prices này.
  // ─────────────────────────────────────────
  async create(dto: CreateTicketPriceDto): Promise<TicketPrice> {
    const row = this.repo.create({
      seat_type: dto.seat_type,
      price: dto.price,
      note: dto.note ?? null,
      changed_by: dto.changed_by ?? null,
    });
    return this.repo.save(row);
  }
}
