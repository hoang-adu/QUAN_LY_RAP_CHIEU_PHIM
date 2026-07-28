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
UPDATE employees SET role = 'admin' WHERE username = 'admin';



-- TK< MK KHÁCH HÀNG MẪU
 
-- 1) Nguyễn Văn An
--    Đăng nhập: an.nguyen@email.com / Mật khẩu: khachhang123
UPDATE customers
SET password = '$2b$12$SvwS4XATHEHORoGdoywD4OI/cmbkpvCNcBN.le2EaHCMlZ9.Bxkrq'
WHERE email = 'an.nguyen@email.com';
 
-- 2) Trần Thị Bình
--    Đăng nhập: binh.tran@email.com / Mật khẩu: khachhang123
UPDATE customers
SET password = '$2b$12$cP6uU1OpfOnm.mkuSxGTWedD2FJbN1aQq5pUXD902Y9QwRwvxrEdm'
WHERE email = 'binh.tran@email.com';
 
-- 3) Phan Thị Hạnh
--    Đăng nhập: hanh.phan@email.com / Mật khẩu: khachhang123
UPDATE customers
SET password = '$2b$12$50E.JVRcCjLs7GiTz04CDuYwKGZIUu2WjdCktb.QEryD2pAz0Wmp2'
WHERE email = 'hanh.phan@email.com';
 
-- 4) Đinh Văn Hải
--    Đăng nhập: hai.dinh@email.com / Mật khẩu: khachhang123
UPDATE customers
SET password = '$2b$12$BzzJ3dLGC0BzieAmNC0ojeFof86.7ONit/OYlSqAkjVIlcZfeJnoa'
WHERE email = 'hai.dinh@email.com';
 
-- 5) Vương Thị Huệ
--    Đăng nhập: hue.vuong@email.com / Mật khẩu: khachhang123
UPDATE customers
SET password = '$2b$12$81zJ08l9odyUjvdTnK/QS.h6RIhnsXZfsb5gWfhDuuf648d2GjqgC'
WHERE email = 'hue.vuong@email.com';
 
-- 6) Lâm Văn Kiên
--    Đăng nhập: kien.lam@email.com / Mật khẩu: khachhang123
UPDATE customers
SET password = '$2b$12$grh3fTSy3QsAF6ek8eO5B.r002jC.h8/IPWK3ZS7fXKwjNenxTfy.'
WHERE email = 'kien.lam@email.com';
 
-- 7) Tô Thị Loan
--    Đăng nhập: loan.to@email.com / Mật khẩu: khachhang123
UPDATE customers
SET password = '$2b$12$UrIkCjHkfKS5hTD/wsMjD../5gGz2JYtAd.VrDJ42vM2VK5q2pzga'
WHERE email = 'loan.to@email.com';
 
-- 8) Chu Văn Nam
--    Đăng nhập: nam.chu@email.com / Mật khẩu: khachhang123
UPDATE customers
SET password = '$2b$12$1yU9CRDlB00DFMNxKVkXI.rUO02t4QftE00xxFc0w3loDBWD0OAkW'
WHERE email = 'nam.chu@email.com';
 
-- 9) Mai Thị Oanh
--    Đăng nhập: oanh.mai@email.com / Mật khẩu: khachhang123
UPDATE customers
SET password = '$2b$12$7vALERc1moxzlJfDFWRZvuNoiPuAlAxI0Co1GILNnYMFj9bOw0NxO'
WHERE email = 'oanh.mai@email.com';
 
-- 10) Hồ Văn Phong
--     Đăng nhập: phong.ho@email.com / Mật khẩu: khachhang123
UPDATE customers
SET password = '$2b$12$vmKEIBH1oeTRDG3fAFEhbuRPD7hvrUfT4TpMkb2VLGJmfEKHdVSX2'
WHERE email = 'phong.ho@email.com';
 
-- Kiểm tra lại kết quả (không hiện password thật ra màn hình):
SELECT customer_id, full_name, phone, email, points,
       (password LIKE '$2%') AS has_real_bcrypt_hash
FROM customers;

UPDATE employees SET role = 'admin' WHERE username = 'admin';