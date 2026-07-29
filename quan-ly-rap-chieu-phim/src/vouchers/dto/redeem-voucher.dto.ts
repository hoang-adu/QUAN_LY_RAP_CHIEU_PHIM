import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class RedeemVoucherDto {
  /**
   * Số điểm muốn đổi lấy voucher (phải >= MIN_REDEEM_POINTS và là bội số
   * của REDEEM_POINTS_STEP — xem src/vouchers/vouchers.constants.ts).
   * @example 100
   */
  @IsInt({ message: 'points phải là số nguyên' })
  @IsPositive({ message: 'points phải lớn hơn 0' })
  points: number;

  /**
   * Đổi điểm CHO khách hàng nào. BẮT BUỘC khi nhân viên/admin đổi hộ tại
   * quầy; BỊ BỎ QUA khi khách hàng tự đổi — backend luôn lấy customer_id
   * từ token đăng nhập của khách, không tin giá trị FE gửi lên.
   * @example 5
   */
  @IsOptional()
  @IsInt({ message: 'customer_id phải là số nguyên' })
  @IsPositive({ message: 'customer_id phải lớn hơn 0' })
  customer_id?: number;
}