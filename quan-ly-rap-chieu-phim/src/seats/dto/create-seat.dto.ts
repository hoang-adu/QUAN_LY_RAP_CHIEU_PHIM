import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateSeatDto {
  @IsInt({ message: 'room_id phải là số nguyên' })
  @IsPositive({ message: 'room_id phải lớn hơn 0' })
  room_id: number;

  @IsString()
  @IsOptional()
  seat_number?: string;

  @IsString()
  @IsOptional()
  seat_type?: string;
}
