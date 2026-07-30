import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultFromKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 13);
  return d.toISOString().slice(0, 10);
}

// Chỉ Admin xem được trang Thống kê (khớp với AdminRoute ở frontend).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  getOverview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.statsService.getOverview(from || defaultFromKey(), to || todayKey());
  }

  @Get('revenue-by-day')
  getRevenueByDay(@Query('from') from?: string, @Query('to') to?: string) {
    return this.statsService.getRevenueByDay(from || defaultFromKey(), to || todayKey());
  }

  @Get('top-movies')
  getTopMovies(@Query('limit') limit?: string) {
    const n = Number(limit);
    const safeLimit = Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 5;
    return this.statsService.getTopMovies(safeLimit);
  }
}
