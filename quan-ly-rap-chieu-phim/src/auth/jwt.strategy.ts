/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  validate(payload: { sub: number; email: string; role?: string }) {
    if (payload.role === 'admin' || payload.role === 'employee') {
      // Token của nhân viên/admin -> gán employee_id + role
      return {
        employee_id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }
    // Token của khách hàng -> luôn gán role = 'customer' để RolesGuard
    // có thể dùng @Roles('customer') phân biệt với admin/employee.
    return { customer_id: payload.sub, email: payload.email, role: 'customer' };
  }
}