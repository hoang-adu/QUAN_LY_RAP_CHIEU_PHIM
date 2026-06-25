import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  booking_id: number;

  @Column()
  customer_id: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  booking_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_amount: number;

  @Column({ length: 20, nullable: true })
  status: string;
}
