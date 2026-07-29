// ─────────────────────────────────────────────────────────────
// TÍCH ĐIỂM (áp dụng khi khách hàng tự đặt vé online và thanh toán ngay)
// Trước đây: cộng cố định 5 điểm/đơn bất kể giá trị đơn hàng.
// Nay: tính theo PHẦN TRĂM giá trị đơn hàng thực trả (sau khi trừ voucher,
// nếu có) — đơn càng lớn càng được nhiều điểm, đúng bản chất loyalty.
// ─────────────────────────────────────────────────────────────
export const EARN_POINTS_PERCENT = 5; // 5% giá trị đơn hàng
export const POINT_VALUE_VND = 1000; // Quy đổi: 1 điểm ứng với 1.000đ giá trị đơn hàng

// ─────────────────────────────────────────────────────────────
// ĐỔI ĐIỂM LẤY VOUCHER GIẢM GIÁ
// Tỉ lệ đổi (VOUCHER_VALUE_PER_POINT) cố tình THẤP HƠN tỉ lệ tích
// (POINT_VALUE_VND) — đây là cách vận hành phổ biến của các chương trình
// khách hàng thân thiết, tránh việc tích rồi đổi lại đúng 100% giá trị.
// ─────────────────────────────────────────────────────────────
export const MIN_REDEEM_POINTS = 100; // Số điểm tối thiểu mỗi lần đổi voucher
export const REDEEM_POINTS_STEP = 50; // Số điểm đổi phải là bội số của bước này
export const VOUCHER_VALUE_PER_POINT = 500; // 1 điểm đổi được 500đ giảm giá
export const VOUCHER_EXPIRY_DAYS = 90; // Voucher hết hạn sau 90 ngày kể từ lúc đổi

export const VOUCHER_STATUSES = ['unused', 'used', 'expired'] as const;