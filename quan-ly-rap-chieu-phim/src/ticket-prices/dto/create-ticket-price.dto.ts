import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { SEAT_TYPES } from '../ticket-prices.constants';

export class CreateTicketPriceDto {
  @IsIn(SEAT_TYPES, {
    message: `seat_type phải là một trong: ${SEAT_TYPES.join(', ')}`,
  })
  seat_type: string;

  @IsNumber()
  @Min(0, { message: 'Giá vé không được âm' })
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  // Không lấy từ client — server tự gán theo req.user (employee đang đăng
  // nhập) trong controller, field này chỉ khai báo cho rõ shape nội bộ.
  @IsOptional()
  @IsInt()
  changed_by?: number;
}
