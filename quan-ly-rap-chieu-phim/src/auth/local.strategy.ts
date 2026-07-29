/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'emailOrPhone', passwordField: 'password' });
  }

  async validate(emailOrPhone: string, password: string) {
    const customer = await this.authService.validateUser(
      emailOrPhone,
      password,
    );
    if (!customer) {
      throw new UnauthorizedException(
        'Email/Số điện thoại hoặc mật khẩu không đúng',
      );
    }
    return customer;
  }
}