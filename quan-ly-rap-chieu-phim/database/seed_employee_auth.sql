
-- 1) Lê Văn Cường -> đăng nhập với quyền EMPLOYEE (chức vụ Nhân viên)
--    Mật khẩu: nhanvien123
UPDATE employees
SET password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee',
    position = 'Nhân viên'
WHERE email = 'cuong.le@cinema.com';

-- 2) Phạm Thị Dung (Thu ngân) -> đăng nhập với quyền EMPLOYEE
--    Mật khẩu: nhanvien123
UPDATE employees
SET password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'dung.pham@cinema.com';

-- 3) Hoàng Văn Em (Bảo vệ) -> đăng nhập với quyền EMPLOYEE
--    Mật khẩu: nhanvien123
UPDATE employees
SET password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email = 'em.hoang@cinema.com';

-- 4) Mặt Trời Nhỏ (Admin) -> đăng nhập với quyền ADMIN
--    Mật khẩu: admin123
UPDATE employees
SET password = '$2b$12$/cVy9WlzM63lNrgv/sMjp.H.FeCyoasdmB/o1b5INFp2CzGxalq1e',
    role = 'admin',
    position = 'Admin'
WHERE email = 'mattroinho@cinema.com';

-- Kiểm tra lại kết quả danh sách nhân viên & phân quyền:
SELECT employee_id, full_name, email, position, role FROM employees;
