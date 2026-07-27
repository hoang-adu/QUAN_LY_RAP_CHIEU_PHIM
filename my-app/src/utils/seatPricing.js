// src/utils/seatPricing.js
// Bảng giá vé cố định theo loại ghế — mỗi phòng luôn có đúng 3 loại ghế
// (30 ghế thường hàng A-C, 40 ghế vip hàng D-G, 10 ghế couple hàng H).
export const SEAT_PRICES = {
  standard: 70000,
  vip: 75000,
  couple: 150000,
};

export function priceForSeatType(seatType) {
  return SEAT_PRICES[seatType] ?? SEAT_PRICES.standard;
}

export const SEAT_TYPE_LABELS = {
  standard: "Ghế thường",
  vip: "Ghế VIP",
  couple: "Ghế Couple",
};
