import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodOrdersService } from './food-orders.service';
import { FoodOrdersController } from './food-orders.controller';
import { FoodOrder } from './food-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FoodOrder])],
  controllers: [FoodOrdersController],
  providers: [FoodOrdersService],
  exports: [FoodOrdersService],
})
export class FoodOrdersModule {}
