import { IsInt, IsOptional, IsPositive, IsNumber, Min } from 'class-validator';

export class CreateFoodOrderDetailDto {
  @IsInt({ message: 'order_id phải là số nguyên' })
  @IsPositive({ message: 'order_id phải lớn hơn 0' })
  order_id: number;

  @IsInt({ message: 'product_id phải là số nguyên' })
  @IsPositive({ message: 'product_id phải lớn hơn 0' })
  product_id: number;

  @IsInt({ message: 'quantity phải là số nguyên' })
  @Min(1, { message: 'quantity phải lớn hơn 0' })
  @IsOptional()
  quantity?: number;

  @IsNumber({}, { message: 'unit_price phải là số' })
  @Min(0, { message: 'unit_price không được âm' })
  @IsOptional()
  unit_price?: number;
}
