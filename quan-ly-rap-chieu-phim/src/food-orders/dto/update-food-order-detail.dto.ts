import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodOrderDetailDto } from './create-food-order-detail.dto';

export class UpdateFoodOrderDetailDto extends PartialType(CreateFoodOrderDetailDto) {}
