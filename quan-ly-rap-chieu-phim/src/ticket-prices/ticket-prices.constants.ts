// Danh sách loại ghế hợp lệ trong hệ thống (khớp với seat.entity.ts /
// SeatsService khi sinh ghế cho phòng chiếu). Khai báo tập trung ở đây để
// validate DTO và để seed dùng chung — thêm loại ghế mới thì chỉ sửa 1 chỗ.
export const SEAT_TYPES = ['standard', 'vip', 'couple'] as const;

// Giá KHỞI TẠO — chỉ dùng ĐÚNG 1 LẦN lúc bảng ticket_prices còn trống (lần
// đầu chạy app sau khi nâng cấp) để không làm thay đổi giá đang áp dụng
// trong thực tế. Sau lần seed đầu tiên, MỌI thay đổi giá phải đi qua API
// quản lý giá (POST /ticket-prices), KHÔNG sửa số ở đây nữa.
export const DEFAULT_SEAT_PRICES: Record<string, number> = {
  standard: 70000,
  vip: 75000,
  couple: 150000,
};
