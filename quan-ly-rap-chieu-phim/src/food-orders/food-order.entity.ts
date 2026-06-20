import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('food_orders')
export class FoodOrder {
  @PrimaryGeneratedColumn()
  order_id: number;

  @Column({ nullable: true })
  customer_id: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  order_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_amount: number;
}
