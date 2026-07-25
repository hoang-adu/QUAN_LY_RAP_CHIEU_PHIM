-- 1) Lê Văn Cường -> đăng nhập với quyền EMPLOYEE (chức vụ Nhân viên)
--    Tài khoản: cuong.le / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'cuong.le',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee',
    position = 'Nhân viên'
WHERE email = 'cuong.le@cinema.com';

-- 2) Phạm Thị Dung (Thu ngân) -> đăng nhập với quyền EMPLOYEE
--    Tài khoản: dung.pham / Mật khẩu: nhanvien123

UPDATE employees
SET username = 'dung.pham',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'dung.pham@cinema.com';

-- 3) Hoàng Văn Em (Bảo vệ) -> đăng nhập với quyền EMPLOYEE
--    Tài khoản: em.hoang / Mật khẩu: nhanvien123
UPDATE employees
SET username = 'em.hoang',
    password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'em.hoang@cinema.com';

-- 4) Mặt Trời Nhỏ (Admin) -> đăng nhập với quyền ADMIN
--    Tài khoản: admin / Mật khẩu: cinema@123
UPDATE employees
SET username = 'admin',
    password = '$2b$12$/FXbgZuGo54XpDXMVu5GD.sH8xQVO6ze7aMq.4kdyy1DmJVnsxT0u',
    role = 'admin',
    position = 'Admin'
WHERE email = 'mattroinho@cinema.com';

-- Kiểm tra lại kết quả danh sách nhân viên & phân quyền:
SELECT employee_id, full_name, username, email, position, role FROM employees;

