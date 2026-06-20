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
} from '@nestjs/common';
import { FoodOrdersService } from './food-orders.service';
import { CreateFoodOrderDto } from './dto/create-food-order.dto';
import { UpdateFoodOrderDto } from './dto/update-food-order.dto';

@Controller('food-orders')
export class FoodOrdersController {
  constructor(private readonly foodOrdersService: FoodOrdersService) {}

  // POST /food-orders - Tạo hóa đơn đồ ăn mới
  @Post()
  create(@Body() createFoodOrderDto: CreateFoodOrderDto) {
    return this.foodOrdersService.create(createFoodOrderDto);
  }

  // GET /food-orders - Lấy danh sách tất cả hóa đơn
  @Get()
  findAll() {
    return this.foodOrdersService.findAll();
  }

  // GET /food-orders/:id - Lấy 1 hóa đơn theo id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodOrdersService.findOne(id);
  }

  // PATCH /food-orders/:id - Cập nhật hóa đơn theo id
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFoodOrderDto: UpdateFoodOrderDto,
  ) {
    return this.foodOrdersService.update(id, updateFoodOrderDto);
  }

  // DELETE /food-orders/:id - Xóa hóa đơn theo id
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.foodOrdersService.remove(id);
  }
}
