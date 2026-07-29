// ⚠️ DEPRECATED — KHÔNG còn là nguồn sự thật cho giá vé nữa.
//
// Giá vé giờ được quản lý ĐỘNG trong bảng `ticket_prices` (xem module
// `ticket-prices/`), có thể chỉnh qua trang quản lý mà không cần deploy
// lại code. checkout.service.ts đã chuyển sang dùng
// `TicketPricesService.getCurrentPrices()` thay vì import từ file này.
//
// File này được GIỮ LẠI (không xoá) chỉ để làm giá trị SEED ban đầu —
// xem `ticket-prices/ticket-prices.constants.ts` (DEFAULT_SEAT_PRICES),
// dùng đúng 1 lần lúc bảng ticket_prices còn trống. Không import file
// này ở chỗ nào khác trong code mới.
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
