-- =====================================================================
-- Thêm bảng vouchers (đổi điểm tích lũy lấy voucher giảm giá).
-- Chỉ chạy 1 lần trên database ĐÃ CÓ SẴN (đã tạo từ
-- quan_ly_rap_chieu_phim.sql trước khi có bảng này). Nếu backend đang
-- chạy với TypeORM synchronize: true thì bảng này đã được tự tạo, KHÔNG
-- cần chạy lại file này.
-- Cách chạy: mysql -u root -p quan_ly_rap_chieu_phim < database/add_vouchers_table.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id      INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT           NOT NULL,
    code            VARCHAR(30)   NOT NULL UNIQUE,
    points_used     INT           NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    status          ENUM('unused', 'used', 'expired') NOT NULL DEFAULT 'unused',
    created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME,
    used_at         DATETIME,
    booking_id      INT,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    FOREIGN KEY (booking_id)  REFERENCES bookings(booking_id)   ON DELETE SET NULL
);
