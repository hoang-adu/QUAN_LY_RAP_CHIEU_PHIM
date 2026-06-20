import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, IsDateString } from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên phim không được để trống' })
  title: string;

  @IsString()
  @IsOptional()
  genre?: string;

  @IsInt()
  @IsPositive({ message: 'Thời lượng phải lớn hơn 0' })
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  director?: string;

  @IsString()
  @IsOptional()
  actors?: string;

  @IsDateString({}, { message: 'Ngày phát hành không đúng định dạng (YYYY-MM-DD)' })
  @IsOptional()
  release_date?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  poster?: string;
}
