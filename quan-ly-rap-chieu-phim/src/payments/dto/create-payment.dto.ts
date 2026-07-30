import {
  IsInt,
  IsOptional,
  IsPositive,
  IsNumber,
  Min,
  IsString,
  IsIn,
} from 'class-validator';

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

  @IsIn(['pending', 'paid', 'failed'], {
    message: 'payment_status phải là pending, paid hoặc failed',
  })
  @IsOptional()
  payment_status?: string;

  // LƯU Ý: giá trị client gửi lên (nếu có) sẽ bị PaymentsController ghi đè
  // theo role thực tế của người gọi API — field này không phải nguồn tin
  // cậy để xác định kênh thanh toán.
  @IsIn(['online', 'counter'])
  @IsOptional()
  channel?: 'online' | 'counter';
}