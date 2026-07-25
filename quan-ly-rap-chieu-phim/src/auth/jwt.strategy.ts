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
    if (payload.role) {
      // Token của nhân viên/admin (có role) -> gán employee_id + role
      return {
        employee_id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }
    // Token của khách hàng -> không có role
    return { customer_id: payload.sub, email: payload.email };
  }
}