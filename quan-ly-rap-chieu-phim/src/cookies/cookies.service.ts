import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

@Injectable()
export class CookiesService {
  // GET /cookies - Xem tất cả cookies
  getAll(req: Request) {
    return { cookies: req.cookies ?? {} };
  }

  // POST /cookies/set - Set cookie
  setCookie(
    res: Response,
    { name, value, maxAge }: { name: string; value: string; maxAge?: number },
  ) {
    res.cookie(name, value, {
      httpOnly: true,
      maxAge: maxAge ?? 3600 * 1000, // mặc định 1 giờ
      sameSite: 'strict',
    });
    return { message: `Đã set cookie "${name}" thành công` };
  }

  // POST /cookies/clear - Xóa cookie
  clearCookie(res: Response, name: string) {
    res.clearCookie(name);
    return { message: `Đã xóa cookie "${name}"` };
  }
}
