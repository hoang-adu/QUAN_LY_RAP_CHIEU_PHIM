import { IsInt, IsOptional, IsPositive, IsNumber, Min, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsInt({ message: 'customer_id phải là số nguyên' })
  @IsPositive({ message: 'customer_id phải lớn hơn 0' })
  customer_id: number;

  @IsNumber({}, { message: 'total_amount phải là số' })
  @Min(0, { message: 'total_amount không được âm' })
  @IsOptional()
  total_amount?: number;

  @IsString()
  @IsOptional()
  status?: string;
}
