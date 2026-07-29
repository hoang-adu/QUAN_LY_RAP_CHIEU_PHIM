import { IsInt, IsPositive } from 'class-validator';

export class CreateSeatLockDto {
  /**
   * ID ghế muốn giữ tạm
   * @example 5
   */
  @IsInt({ message: 'seat_id phải là số nguyên' })
  @IsPositive({ message: 'seat_id phải lớn hơn 0' })
  seat_id: number;
}
