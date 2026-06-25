import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('showtimes')
export class Showtime {
  @PrimaryGeneratedColumn()
  showtime_id: number;

  @Column()
  movie_id: number;

  @Column()
  room_id: number;

  @Column({ type: 'date', nullable: true })
  show_date: string;

  @Column({ type: 'time', nullable: true })
  start_time: string;

  @Column({ type: 'time', nullable: true })
  end_time: string;
}
