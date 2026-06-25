import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodOrdersService } from './food-orders.service';
import { FoodOrdersController } from './food-orders.controller';
import { FoodOrder } from './food-order.entity';
import { FoodOrderDetail } from './food-order-detail.entity';
import { FoodOrderDetailsService } from './food-order-details.service';
import { FoodOrderDetailsController } from './food-order-details.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FoodOrder, FoodOrderDetail])],
  controllers: [FoodOrdersController, FoodOrderDetailsController],
  providers: [FoodOrdersService, FoodOrderDetailsService],
  exports: [FoodOrdersService, FoodOrderDetailsService],
})
export class FoodOrdersModule {}
