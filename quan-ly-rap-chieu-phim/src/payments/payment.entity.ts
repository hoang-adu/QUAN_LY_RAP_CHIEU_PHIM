import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  payment_id: number;

  @Column()
  booking_id: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  payment_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ length: 50, nullable: true })
  payment_method: string;

  @Column({ length: 20, nullable: true })
  payment_status: string;

  // Kênh thanh toán: 'online' (khách tự đặt+trả qua app) hay 'counter' (nhân
  // viên thu tại quầy). Do BACKEND tự gán theo role người gọi API khi tạo
  // (không tin dữ liệu client gửi lên), dùng để chặn sửa/hoàn tiền cho các
  // thanh toán online đã 'paid' theo đúng quy định "không hoàn tiền vé
  // online". nullable vì dữ liệu cũ (trước khi có cột này) không xác định
  // được kênh.
  @Column({ type: 'varchar', length: 10, nullable: true })
  channel: 'online' | 'counter' | null;
}