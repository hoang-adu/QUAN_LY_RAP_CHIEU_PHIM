-- ==========================================================================
-- Script gán mật khẩu đăng nhập + phân quyền cho nhân viên có sẵn trong CSDL
-- CHẠY SAU KHI: đã restart backend 1 lần (để TypeORM tự thêm cột password, role
-- vào bảng employees nhờ synchronize: true trong app.module.ts)
-- ==========================================================================

-- 1) Lê Văn Cường (Quản lý) -> đăng nhập với quyền ADMIN
--    Mật khẩu: admin123
UPDATE employees
SET password = '$2b$12$/cVy9WlzM63lNrgv/sMjp.H.FeCyoasdmB/o1b5INFp2CzGxalq1e',
    role = 'admin'
WHERE email = 'cuong.le@cinema.com';

-- 2) Phạm Thị Dung (Thu ngân) -> đăng nhập với quyền EMPLOYEE (nhân viên bán vé)
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

-- Kiểm tra lại kết quả:
SELECT employee_id, full_name, email, position, role FROM employees;
