import {
  Body,
  Controller,
  HttpCode,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  register(@Body() registerCustomerDto: RegisterCustomerDto) {
    return this.authService.register(registerCustomerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @Request() req: { user: { customer_id: number; email: string } },
    @Body() loginCustomerDto: LoginCustomerDto,
  ) {
    void loginCustomerDto;
    return this.authService.login(req.user);
  }

  // Đăng nhập cho Admin/Nhân viên rạp (dùng bảng employees, không phải customers)
  @Post('employee/login')
  @HttpCode(200)
  async employeeLogin(@Body() loginEmployeeDto: LoginCustomerDto) {
    const employee = await this.authService.validateEmployee(
      loginEmployeeDto.email,
      loginEmployeeDto.password,
    );
    if (!employee) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.authService.loginEmployee(employee);
  }
}
