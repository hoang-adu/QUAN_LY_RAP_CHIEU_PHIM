import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CheckoutSeatDto {
  /**
   * ID của ghế muốn đặt
   * @example 12
   */
  @IsInt({ message: 'seat_id phải là số nguyên' })
  @IsPositive({ message: 'seat_id phải lớn hơn 0' })
  seat_id: number;

  /**
   * Giá vé FE tạm tính để hiển thị (đơn vị: VNĐ). CHỈ mang tính tham khảo —
   * backend luôn tự tính lại giá thật theo seat_type trong DB, không dùng
   * giá trị này để tính tiền hay lưu vào CSDL (tránh client giả mạo giá).
   * @example 75000
   */
  @IsOptional()
  @IsNumber({}, { message: 'ticket_price phải là số' })
  @Min(0, { message: 'ticket_price không được âm' })
  ticket_price?: number;
}


export class CheckoutFoodItemDto {
  @IsInt({ message: 'product_id phải là số nguyên' })
  @IsPositive({ message: 'product_id phải lớn hơn 0' })
  product_id: number;

  @IsInt({ message: 'quantity phải là số nguyên' })
  @IsPositive({ message: 'quantity phải lớn hơn 0' })
  quantity: number;
}

// DTO cho POST /bookings/checkout — gộp "tạo đơn + tạo vé cho từng ghế +
// thu tiền" thành 1 request duy nhất, thay vì FE phải tự gọi lần lượt
// POST /bookings -> POST /tickets (x N) -> POST /payments như trước.
export class CheckoutBookingDto {
  /**
   * Khách hàng đặt cho ai. BẮT BUỘC khi nhân viên bán tại quầy (chọn khách
   * vãng lai); bị BỎ QUA khi khách hàng tự đặt online — backend luôn lấy
   * customer_id từ token đăng nhập của khách, không tin giá trị FE gửi lên.
   * @example 5
   */
  @IsOptional()
  @IsInt({ message: 'customer_id phải là số nguyên' })
  @IsPositive({ message: 'customer_id phải lớn hơn 0' })
  customer_id?: number;

  /**
   * ID của suất chiếu
   * @example 3
   */
  @IsInt({ message: 'showtime_id phải là số nguyên' })
  @IsPositive({ message: 'showtime_id phải lớn hơn 0' })
  showtime_id: number;

  @IsArray({ message: 'seats phải là danh sách ghế' })
  @ArrayMinSize(1, { message: 'Vui lòng chọn ít nhất 1 ghế' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutSeatDto)
  seats: CheckoutSeatDto[];

  /**
   * Có thu tiền ngay khi tạo đơn hay không (mặc định: có). Nhân viên có
   * thể bỏ qua (false) nếu khách chưa trả tiền ngay, để tạo đơn "pending"
   * rồi thu tiền sau ở trang Thanh toán.
   */
  @IsOptional()
  @IsArray({ message: 'food_items phải là danh sách sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutFoodItemDto)
  food_items?: CheckoutFoodItemDto[];

  @IsOptional()
  @IsBoolean({ message: 'pay phải là true/false' })
  pay?: boolean;

  @IsOptional()
  @IsString()
  payment_method?: string;

  /**
   * Mã voucher giảm giá muốn áp dụng (đổi từ điểm tích lũy qua
   * POST /vouchers/redeem). Chỉ áp dụng được khi thu tiền ngay
   * (pay !== false) và voucher phải thuộc về khách hàng đang đặt vé.
   * @example "GG-7K2QX9"
   */
  @IsOptional()
  @IsString()
  voucher_code?: string;
}