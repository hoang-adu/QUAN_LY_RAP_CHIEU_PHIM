-- ==========================================================
-- SEED ĐẦY ĐỦ TÀI KHOẢN ĐĂNG NHẬP CHO TOÀN BỘ 11 NHÂN VIÊN
-- (Bổ sung so với seed_employee_auth.sql gốc: bản gốc mới chỉ có 4/11)
-- Hash bcrypt (12 rounds), tương thích bcrypt.compare() bên NestJS.
-- ==========================================================

-- 1) Lê Văn Cường -> EMPLOYEE
--    Tài khoản: cuong.le / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'cuong.le',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee',
    position = 'Nhân viên'
WHERE email = 'cuong.le@cinema.com';

-- 2) Phạm Thị Dung (Thu ngân) -> EMPLOYEE
--    Tài khoản: dung.pham / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'dung.pham',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'dung.pham@cinema.com';

-- 3) Hoàng Văn Em (Bảo vệ) -> EMPLOYEE
--    Tài khoản: em.hoang / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'em.hoang',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'em.hoang@cinema.com';

-- 4) Mặt Trời Nhỏ (Admin) -> ADMIN
--    Tài khoản: admin / Mật khẩu: cinema@123
UPDATE employees
SET username = 'admin',
    password = '$2b$12$/FXbgZuGo54XpDXMVu5GD.sH8xQVO6ze7aMq.4kdyy1DmJVnsxT0u',
    role = 'admin',
    position = 'Admin'
WHERE email = 'mattroinho@cinema.com';

-- 5) Vũ Thị Hoa (Thu ngân) -> EMPLOYEE
--    Tài khoản: hoa.vu / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'hoa.vu',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'hoa.vu@cinema.com';

-- 6) Đặng Văn Khoa (Nhân viên) -> EMPLOYEE
--    Tài khoản: khoa.dang / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'khoa.dang',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'khoa.dang@cinema.com';

-- 7) Bùi Thị Lan (Nhân viên) -> EMPLOYEE
--    Tài khoản: lan.bui / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'lan.bui',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'lan.bui@cinema.com';

-- 8) Ngô Văn Minh (Bảo vệ) -> EMPLOYEE
--    Tài khoản: minh.ngo / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'minh.ngo',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'minh.ngo@cinema.com';

-- 9) Đỗ Thị Nga (Thu ngân) -> EMPLOYEE
--    Tài khoản: nga.do / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'nga.do',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'nga.do@cinema.com';

-- 10) Trịnh Văn Phúc (Nhân viên) -> EMPLOYEE
--     Tài khoản: phuc.trinh / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'phuc.trinh',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'phuc.trinh@cinema.com';

-- 11) Lý Thị Quỳnh (Quản lý) -> EMPLOYEE (chỉ Mặt Trời Nhỏ mới là admin)
--     Tài khoản: quynh.ly / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'quynh.ly',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee',
    position = 'Quản lý'
WHERE email = 'quynh.ly@cinema.com';

-- Kiểm tra lại kết quả danh sách nhân viên & phân quyền:
SELECT employee_id, full_name, username, email, position, role FROM employees;