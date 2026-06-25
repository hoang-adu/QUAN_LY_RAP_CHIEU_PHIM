import { IsInt, IsOptional, IsPositive, IsDateString, IsString } from 'class-validator';

export class CreateShowtimeDto {
  @IsInt({ message: 'movie_id phải là số nguyên' })
  @IsPositive({ message: 'movie_id phải lớn hơn 0' })
  movie_id: number;

  @IsInt({ message: 'room_id phải là số nguyên' })
  @IsPositive({ message: 'room_id phải lớn hơn 0' })
  room_id: number;

  @IsDateString({}, { message: 'show_date không đúng định dạng (YYYY-MM-DD)' })
  @IsOptional()
  show_date?: string;

  @IsString()
  @IsOptional()
  start_time?: string;

  @IsString()
  @IsOptional()
  end_time?: string;
}
