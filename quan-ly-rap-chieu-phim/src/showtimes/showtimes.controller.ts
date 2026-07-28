import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
  ParseIntPipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Post()
  create(@Body() createShowtimeDto: CreateShowtimeDto) {
    return this.showtimesService.create(createShowtimeDto);
  }

  // Public: khách cần xem lịch chiếu để đặt vé, kể cả trước khi đăng nhập
  @Get()
  findAll() {
    return this.showtimesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShowtimeDto: UpdateShowtimeDto,
  ) {
    return this.showtimesService.update(id, updateShowtimeDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.remove(id);
  }
}