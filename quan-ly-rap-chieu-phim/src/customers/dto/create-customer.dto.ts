import { IsString, IsOptional, IsEmail, IsInt, Min } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsInt()
  @Min(0, { message: 'points phải lớn hơn hoặc bằng 0' })
  @IsOptional()
  points?: number;
}
