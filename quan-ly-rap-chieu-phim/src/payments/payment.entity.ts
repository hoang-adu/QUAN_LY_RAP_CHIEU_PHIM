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
}
