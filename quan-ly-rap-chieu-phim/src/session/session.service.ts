import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
  setSession(session: Record<string, unknown>, data: Record<string, unknown>) {
    if (!session) {
      return { message: 'Session chưa được khởi tạo' };
    }
    Object.assign(session, data);
    return { message: 'Đã lưu session thành công', data };
  }

  getSession(session: Record<string, unknown>) {
    return { session: session ?? {} };
  }

  clearSession(session: Record<string, unknown> & { destroy?: () => void }) {
    if (session && typeof session.destroy === 'function') {
      session.destroy();
    }
    return { message: 'Đã xóa session' };
  }
}
