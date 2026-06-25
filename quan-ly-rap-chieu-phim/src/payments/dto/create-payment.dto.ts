import { IsInt, IsOptional, IsPositive, IsNumber, Min, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsInt({ message: 'booking_id phải là số nguyên' })
  @IsPositive({ message: 'booking_id phải lớn hơn 0' })
  booking_id: number;

  @IsNumber({}, { message: 'amount phải là số' })
  @Min(0, { message: 'amount không được âm' })
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsString()
  @IsOptional()
  payment_status?: string;
}
