import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

// ─────────────────────────────────────────────────────────────────
// LỊCH SỬ GIÁ VÉ theo loại ghế (standard/vip/couple...).
//
// THIẾT KẾ QUAN TRỌNG: bảng này CHỈ INSERT, KHÔNG BAO GIỜ UPDATE/DELETE
// dòng cũ. Mỗi lần admin đổi giá -> thêm 1 dòng mới với created_at =
// thời điểm đổi giá. "Giá hiện tại" của 1 seat_type = dòng có created_at
// MỚI NHẤT của seat_type đó.
//
// Lý do làm vậy thay vì có 1 cột price trong bảng cấu hình rồi UPDATE
// đè lên: nếu UPDATE đè, ta sẽ mất hoàn toàn giá cũ -> không thể trả lời
// câu hỏi "vé bán lúc 3 tháng trước giá bao nhiêu". Với cách append-only
// này, lịch sử giá được giữ lại tự nhiên mà không cần thêm bảng phụ.
//
// Vé đã bán KHÔNG bị ảnh hưởng khi đổi giá vì Ticket.ticket_price đã
// được "chốt" (snapshot) ngay lúc checkout (xem checkout.service.ts) —
// bảng này chỉ quyết định giá cho các vé bán TỪ THỜI ĐIỂM ĐỔI GIÁ TRỞ ĐI.
// ─────────────────────────────────────────────────────────────────
@Entity('ticket_prices')
@Index(['seat_type', 'created_at'])
export class TicketPrice {
  @PrimaryGeneratedColumn()
  price_id: number;

  @Column({ length: 20 })
  seat_type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // Ai đổi giá (employee_id của admin) — phục vụ tra cứu/đối soát sau này.
  // LƯU Ý: phải khai type: 'int' tường minh — TypeORM đọc kiểu cột qua
  // reflect-metadata, mà kiểu union "number | null" bị reflect thành
  // "Object" (không phải "Number"), khiến MySQL báo lỗi "Data type Object
  // is not supported" nếu không chỉ rõ type ở đây.
  @Column({ type: 'int', nullable: true })
  changed_by: number | null;

  // Ghi chú lý do đổi giá (vd. "Tăng giá dịp Tết 2027") — không bắt buộc.
  // Tương tự trên: "string | null" cũng cần khai type: 'varchar' tường minh.
  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}