import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Body,
  HttpCode,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CookiesService } from './cookies.service';

@Controller('cookies')
export class CookiesController {
  constructor(private readonly cookiesService: CookiesService) {}

  @Get()
  getAll(@Req() req: Request) {
    return this.cookiesService.getAll(req);
  }

  @Post('set')
  @HttpCode(200)
  setCookie(
    @Body() body: { name: string; value: string; maxAge?: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.cookiesService.setCookie(res, body);
  }

  @Post('clear')
  @HttpCode(200)
  clearCookie(
    @Body() body: { name: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.cookiesService.clearCookie(res, body.name);
  }
}
