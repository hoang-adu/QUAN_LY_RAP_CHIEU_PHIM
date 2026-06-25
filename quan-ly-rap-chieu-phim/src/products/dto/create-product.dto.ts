import { IsString, IsOptional, IsNumber, Min, IsInt } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsOptional()
  product_name?: string;

  @IsNumber({}, { message: 'price phải là số' })
  @Min(0, { message: 'price không được âm' })
  @IsOptional()
  price?: number;

  @IsInt({ message: 'stock_quantity phải là số nguyên' })
  @Min(0, { message: 'stock_quantity không được âm' })
  @IsOptional()
  stock_quantity?: number;
}
