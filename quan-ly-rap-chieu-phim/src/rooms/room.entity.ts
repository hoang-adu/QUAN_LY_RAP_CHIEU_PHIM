import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  room_id: number;

  @Column({ length: 50 })
  room_name: string;

  @Column({ length: 50, nullable: true })
  room_type: string;

  @Column({ type: 'int', nullable: true })
  seat_count: number;
}
