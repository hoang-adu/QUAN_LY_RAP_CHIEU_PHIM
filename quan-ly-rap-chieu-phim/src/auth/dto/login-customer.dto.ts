import { IsNotEmpty, IsString } from 'class-validator';

export class LoginCustomerDto {
  @IsNotEmpty({ message: 'Vui lòng nhập email hoặc số điện thoại' })
  @IsString({ message: 'Email/Số điện thoại phải là chuỗi ký tự' })
  emailOrPhone: string;

  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  @IsString({ message: 'Password phải là chuỗi ký tự' })
  password: string;
}