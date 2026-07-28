import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SeatLocksService, Holder } from './seat-locks.service';
import { CreateSeatLockDto } from './dto/create-seat-lock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthedRequest {
  user: { role?: string; customer_id?: number; employee_id?: number };
}

// Suy ra "holder" (ai đang giữ ghế) từ token đăng nhập — dùng chung cho cả
// khách hàng tự đặt online lẫn nhân viên bán tại quầy.
function holderFromRequest(req: AuthedRequest): Holder {
  const user = req.user;
  const isStaff = user?.role === 'admin' || user?.role === 'employee';
  if (isStaff) {
    return { holder_type: 'employee', holder_id: user.employee_id as number };
  }
  return { holder_type: 'customer', holder_id: user.customer_id as number };
}

// Mọi thao tác giữ/nhả ghế đều yêu cầu đăng nhập (khách hàng hoặc nhân
// viên) — khách vãng lai chưa đăng nhập chỉ xem được sơ đồ ghế qua
// GET /seats, chưa cần giữ chỗ.
@UseGuards(JwtAuthGuard)
@Controller('showtimes/:showtimeId/seat-locks')
export class SeatLocksController {
  constructor(private readonly seatLocksService: SeatLocksService) {}

  // POST /showtimes/:showtimeId/seat-locks
  // Giữ ghế (hoặc gia hạn nếu gọi lại trước khi hết hạn) — FE gọi lúc
  // khách chọn ghế, và lặp lại định kỳ (heartbeat) khi khách còn đang giữ
  // ghế để không bị hết hạn giữa chừng.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async hold(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
    @Body() dto: CreateSeatLockDto,
    @Request() req: AuthedRequest,
  ) {
    const lock = await this.seatLocksService.hold(
      showtimeId,
      dto.seat_id,
      holderFromRequest(req),
    );
    return {
      seat_id: lock.seat_id,
      expires_at: lock.expires_at,
    };
  }

  // GET /showtimes/:showtimeId/seat-locks
  // Danh sách ghế đang bị giữ (còn hiệu lực) — FE poll định kỳ để tô màu
  // "đang được giữ" trên sơ đồ ghế, đồng thời biết ghế nào là do CHÍNH
  // MÌNH đang giữ (mine: true) để hiện đếm ngược riêng.
  @Get()
  async list(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
    @Request() req: AuthedRequest,
  ) {
    return this.seatLocksService.findActiveForShowtime(
      showtimeId,
      holderFromRequest(req),
    );
  }

  // DELETE /showtimes/:showtimeId/seat-locks/:seatId
  // Nhả ghế chủ động (khách bỏ chọn ghế / rời trang / hủy thao tác).
  @Delete(':seatId')
  @HttpCode(HttpStatus.OK)
  release(
    @Param('showtimeId', ParseIntPipe) showtimeId: number,
    @Param('seatId', ParseIntPipe) seatId: number,
    @Request() req: AuthedRequest,
  ) {
    return this.seatLocksService.release(
      showtimeId,
      seatId,
      holderFromRequest(req),
    );
  }
}
