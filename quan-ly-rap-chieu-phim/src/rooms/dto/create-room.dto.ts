import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên phòng không được để trống' })
  room_name: string;

  @IsString()
  @IsOptional()
  room_type?: string;

  @IsInt()
  @IsOptional()
  @IsPositive({ message: 'seat_count phải lớn hơn 0' })
  seat_count?: number;
}
