import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;

  @IsString()
  @IsOptional()
  @IsIn(['admin', 'employee'], { message: 'Quyền chỉ được là admin hoặc employee' })
  role?: string;
}