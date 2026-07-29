-- database/seed_ticket_codes.sql
-- Backfill ticket_code cho các vé được TẠO TRƯỚC Phase 3 (chưa có mã vé).
--
-- ĐIỀU KIỆN TIÊN QUYẾT: phải chạy fix ở ticket.entity.ts (bỏ unique:true
-- trên ticket_code, đổi thành @Index()) VÀ khởi động lại backend một lần
-- (synchronize: true sẽ tự ALTER TABLE bỏ UNIQUE INDEX cũ trong MySQL)
-- TRƯỚC KHI chạy file này. Nếu chưa bỏ unique, UPDATE bên dưới sẽ báo lỗi
-- ER_DUP_ENTRY ngay khi 1 booking có từ 2 vé (2 ghế) trở lên — đây chính là
-- lý do file seed cũ "không chạy được".
--
-- Cách chạy: mysql -u root -p quan_ly_rap_chieu_phim < database/seed_ticket_codes.sql

-- Tắt Safe Update Mode CHỈ trong phạm vi session này — bảng tạm
-- tmp_booking_codes không có khóa (PRIMARY/UNIQUE KEY) vì tạo bằng
-- CREATE TABLE ... AS SELECT, nên MySQL Workbench sẽ luôn chặn DELETE trên
-- nó ở bước 2 nếu không tắt safe mode, bất kể WHERE/JOIN viết thế nào.
SET SQL_SAFE_UPDATES = 0;

-- 1) Với mỗi booking đang có vé thiếu mã, sinh SẴN 1 mã ngẫu nhiên duy nhất
--    (không phân biệt hoa/thường gây nhầm lẫn: bỏ 0/O/1/I bằng cách chỉ
--    lấy hex rồi loại trừ; ở đây dùng MD5+RAND là đủ tốt cho việc backfill
--    dữ liệu cũ, tỉ lệ trùng gần như bằng 0 với vài chục/vài trăm booking).
DROP TEMPORARY TABLE IF EXISTS tmp_booking_codes;

CREATE TEMPORARY TABLE tmp_booking_codes AS
SELECT
  booking_id,
  CONCAT('VE-', UPPER(SUBSTRING(MD5(CONCAT(RAND(), '-', booking_id, '-', NOW(6))), 1, 6))) AS ticket_code
FROM (
  SELECT DISTINCT booking_id
  FROM tickets
  WHERE ticket_code IS NULL
) AS need_code;

-- 2) An toàn thêm: loại các mã trùng (hiếm khi xảy ra) với mã đã tồn tại
--    trong bảng tickets, để không insert trùng với vé đã có mã từ trước.
DELETE tbc FROM tmp_booking_codes tbc
JOIN tickets t ON t.ticket_code = tbc.ticket_code;

-- 3) Gán mã dùng CHUNG cho TẤT CẢ các dòng vé (mọi ghế) của cùng booking đó
--    — đúng nghiệp vụ: 1 lần đặt vé = 1 mã vé, dù bao nhiêu ghế.
UPDATE tickets t
JOIN tmp_booking_codes tbc ON tbc.booking_id = t.booking_id
SET t.ticket_code = tbc.ticket_code
WHERE t.ticket_code IS NULL;

DROP TEMPORARY TABLE IF EXISTS tmp_booking_codes;

SET SQL_SAFE_UPDATES = 1;

-- 4) Kiểm tra lại: liệt kê mã vé theo từng booking để xác nhận mỗi booking
--    chỉ có ĐÚNG 1 mã (COUNT(DISTINCT ticket_code) phải luôn = 1).
SELECT
  booking_id,
  COUNT(*) AS so_ve,
  COUNT(DISTINCT ticket_code) AS so_ma_khac_nhau,
  GROUP_CONCAT(DISTINCT ticket_code) AS ma_ve
FROM tickets
GROUP BY booking_id
ORDER BY booking_id;