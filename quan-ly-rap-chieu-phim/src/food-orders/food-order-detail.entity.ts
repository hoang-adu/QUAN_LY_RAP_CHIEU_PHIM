import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('food_order_details')
export class FoodOrderDetail {
  @PrimaryColumn()
  order_id: number;

  @PrimaryColumn()
  product_id: number;

  @Column({ type: 'int', nullable: true })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unit_price: number;
}
