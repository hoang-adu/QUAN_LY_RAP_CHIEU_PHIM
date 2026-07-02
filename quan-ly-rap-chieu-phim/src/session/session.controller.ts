import { Controller, Get, Post, Body, HttpCode, Session } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('set')
  @HttpCode(200)
  setSession(
    @Body() body: Record<string, unknown>,
    @Session() session: Record<string, unknown>,
  ) {
    return this.sessionService.setSession(session, body);
  }

  @Get()
  getSession(@Session() session: Record<string, unknown>) {
    return this.sessionService.getSession(session);
  }

  @Post('clear')
  @HttpCode(200)
  clearSession(
    @Session() session: Record<string, unknown> & { destroy?: () => void },
  ) {
    return this.sessionService.clearSession(session);
  }
}
