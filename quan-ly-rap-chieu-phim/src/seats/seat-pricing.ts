// Bảng giá vé cố định theo loại ghế — PHẢI khớp với
// my-app/src/utils/seatPricing.js (bản hiển thị phía FE). Đây là nguồn
// SỰ THẬT DUY NHẤT dùng để tính tiền ở backend; giá ticket_price mà client
// gửi lên trong request checkout chỉ mang tính tham khảo/hiển thị tạm,
// KHÔNG được dùng để tính total_amount hay lưu vào DB.
export const SEAT_PRICES: Record<string, number> = {
  standard: 70000,
  vip: 75000,
  couple: 150000,
};

export function priceForSeatType(seatType?: string | null): number {
  if (seatType && SEAT_PRICES[seatType] != null) {
    return SEAT_PRICES[seatType];
  }
  return SEAT_PRICES.standard;
}
