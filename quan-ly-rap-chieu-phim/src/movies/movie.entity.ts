import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn()
  movie_id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 100, nullable: true })
  genre: string;

  @Column({ nullable: true })
  duration: number;

  @Column({ length: 255, nullable: true })
  director: string;

  @Column({ type: 'text', nullable: true })
  actors: string;

  @Column({ type: 'date', nullable: true })
  release_date: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  poster: string;
}
