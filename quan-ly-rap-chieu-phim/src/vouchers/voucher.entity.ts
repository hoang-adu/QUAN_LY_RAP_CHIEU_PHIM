import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn()
  voucher_id: number;

  @Column()
  customer_id: number;

  // Mã voucher, khách nhập vào bước thanh toán để áp dụng giảm giá.
  @Column({ length: 30, unique: true })
  code: string;

  // Số điểm đã dùng để đổi voucher này — giữ lại để đối soát, không hoàn
  // điểm kể cả khi voucher hết hạn chưa dùng.
  @Column({ type: 'int' })
  points_used: number;

  // Số tiền được giảm khi áp dụng voucher (VNĐ).
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount_amount: number;

  // 'unused' -> chưa dùng, 'used' -> đã áp dụng vào 1 đơn, 'expired' -> hết hạn.
  @Column({ length: 20, default: 'unused' })
  status: 'unused' | 'used' | 'expired';

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  used_at: Date | null;

  // Đơn đặt vé đã áp dụng voucher này (chỉ có giá trị khi status = 'used').
  @Column({ type: 'int', nullable: true })
  booking_id: number | null;
}