import { Controller, Get, Post, Patch, Param, Delete, Body, ParseIntPipe, HttpCode, Query } from '@nestjs/common';
import { FoodOrderDetailsService } from './food-order-details.service';
import { CreateFoodOrderDetailDto } from './dto/create-food-order-detail.dto';
import { UpdateFoodOrderDetailDto } from './dto/update-food-order-detail.dto';

@Controller('food-order-details')
export class FoodOrderDetailsController {
  constructor(private readonly detailsService: FoodOrderDetailsService) {}

  @Post()
  create(@Body() dto: CreateFoodOrderDetailDto) {
    return this.detailsService.create(dto);
  }

  @Get()
  findAll() {
    return this.detailsService.findAll();
  }

  @Get('by-order/:orderId')
  findByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.detailsService.findByOrder(orderId);
  }

  @Get(':orderId/:productId')
  findOne(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.detailsService.findOne(orderId, productId);
  }

  @Patch(':orderId/:productId')
  update(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateFoodOrderDetailDto,
  ) {
    return this.detailsService.update(orderId, productId, dto);
  }

  @Delete(':orderId/:productId')
  @HttpCode(200)
  remove(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.detailsService.remove(orderId, productId);
  }
}
