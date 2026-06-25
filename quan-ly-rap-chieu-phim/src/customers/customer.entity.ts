import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  customer_id: number;

  @Column({ length: 100, nullable: true })
  full_name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, unique: true, nullable: true })
  email: string;

  @Column({ length: 255, nullable: true })
  password: string;

  @Column({ type: 'int', default: 0 })
  points: number;
}
