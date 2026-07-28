import { Entity, Column, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tickets')
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