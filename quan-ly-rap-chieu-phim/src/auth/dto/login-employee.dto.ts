import { IsNotEmpty, IsString } from 'class-validator';

export class LoginEmployeeDto {
  @IsString({ message: 'Tài khoản phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tài khoản không được để trống' })
  username: string;

  @IsString({ message: 'Password phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Password không được để trống' })
  password: string;
}
