import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn()
  seat_id: number;

  @Column()
  room_id: number;

  @Column({ length: 10, nullable: true })
  seat_number: string;

  @Column({ length: 20, nullable: true })
  seat_type: string;
}
