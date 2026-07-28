import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { FoodOrdersService } from './food-orders.service';
import { CreateFoodOrderDto } from './dto/create-food-order.dto';
import { UpdateFoodOrderDto } from './dto/update-food-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface AuthedRequest {
  user: { role?: string; customer_id?: number; employee_id?: number };
}

@UseGuards(JwtAuthGuard)
@Controller('food-orders')
export class FoodOrdersController {
  constructor(private readonly foodOrdersService: FoodOrdersService) {}

  // POST /food-orders - Khách hàng đặt đồ ăn cho chính mình; nhân viên/admin
  // tạo được cho bất kỳ khách nào (bán tại quầy)
  @Post()
  create(
    @Body() createFoodOrderDto: CreateFoodOrderDto,
    @Request() req: AuthedRequest,
  ) {
    const user = req.user;
    const isStaff = user?.role === 'admin' || user?.role === 'employee';
    if (!isStaff && user?.customer_id !== createFoodOrderDto.customer_id) {
      throw new ForbiddenException('Bạn chỉ có thể đặt đồ ăn cho chính mình');
    }
    return this.foodOrdersService.create(createFoodOrderDto);
  }

  // GET /food-orders - chỉ nhân viên/admin xem toàn bộ hóa đơn đồ ăn
  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Get()
  findAll() {
    return this.foodOrdersService.findAll();
  }

  // GET /food-orders/:id - staff xem mọi hóa đơn; khách chỉ xem hóa đơn của mình
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthedRequest,
  ) {
    const order = await this.foodOrdersService.findOne(id);
    const user = req.user;
    const isStaff = user?.role === 'admin' || user?.role === 'employee';
    if (!isStaff && order.customer_id !== user?.customer_id) {
      throw new ForbiddenException('Bạn không có quyền xem hóa đơn này');
    }
    return order;
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFoodOrderDto: UpdateFoodOrderDto,
  ) {
    return this.foodOrdersService.update(id, updateFoodOrderDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'employee')
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.foodOrdersService.remove(id);
  }
}