import { IsEmail, IsString } from 'class-validator';

export class LoginCustomerDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Password phải là chuỗi ký tự' })
  password: string;
}
