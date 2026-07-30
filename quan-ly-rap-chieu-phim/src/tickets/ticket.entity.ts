import { Entity, Column, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

// Ràng buộc UNIQUE thật ở DB — lớp phòng thủ cuối cùng chống bán trùng 1
// ghế cho 2 booking khác nhau trong cùng 1 suất chiếu, phòng khi khóa
// pessimistic_write trong checkout.service.ts/tickets.service.ts bị bỏ
// qua (bug, hoặc 1 đường tạo vé mới trong tương lai quên khóa). Giống hệt
// cách seat_lock.entity.ts đã làm cho bảng seat_locks.
@Entity('tickets')
@Unique('UQ_ticket_showtime_seat', ['showtime_id', 'seat_id'])
export class Ticket {
  @PrimaryGeneratedColumn()
  ticket_id: number;

  @Column({ nullable: false })
  booking_id: number;

  @Column({ nullable: false })
  showtime_id: number;

  @Column({ nullable: false })
  seat_id: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  ticket_price: number;

  @Index()
  @Column({ length: 20, nullable: true })
  ticket_code: string;

  // Đã được nhận vé thật tại quầy hay chưa (đối với vé đặt online).
  @Column({ type: 'boolean', default: false })
  is_picked_up: boolean;

  // Thời điểm nhân viên xác nhận đưa vé tại quầy.
  @Column({ type: 'datetime', nullable: true })
  picked_up_at: Date | null;
}