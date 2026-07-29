import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  Index,
} from 'typeorm';

// Mỗi dòng = 1 ghế đang được 1 người "giữ tạm" cho 1 suất chiếu, trong lúc
// họ điền thông tin/thanh toán. Hết hạn (expires_at < NOW) coi như không
// còn hiệu lực, người khác được phép giữ lại ghế đó.
// UNIQUE(showtime_id, seat_id) -> tại 1 thời điểm chỉ có tối đa 1 lock cho
// 1 ghế trong 1 suất chiếu (kể cả lock đã hết hạn thì vẫn còn hàng, chỉ bị
// ghi đè khi có người giữ mới -> tránh phình bảng theo thời gian).
@Entity('seat_locks')
@Unique('UQ_seat_lock_showtime_seat', ['showtime_id', 'seat_id'])
@Index(['expires_at'])
export class SeatLock {
  @PrimaryGeneratedColumn()
  lock_id: number;

  @Column()
  showtime_id: number;

  @Column()
  seat_id: number;

  // 'customer' hoặc 'employee' (nhân viên bán tại quầy cũng cần giữ ghế khi
  // đang thao tác cho khách vãng lai).
  @Column({ length: 20 })
  holder_type: 'customer' | 'employee';

  // customer_id hoặc employee_id tuỳ theo holder_type.
  @Column()
  holder_id: number;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
