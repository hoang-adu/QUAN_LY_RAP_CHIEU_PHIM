
-- Nhóm role = 'employee' -> mật khẩu: nhanvien123
UPDATE employees
SET password = '$2b$12$yoFuiY6Y1tEvcpeYEYUPy..rmOXzhsYNSgWDWg/62cIgqqoGkIA4W',
    role = 'employee'
WHERE email IN (
    'cuong.le@cinema.com',
    'dung.pham@cinema.com',
    'em.hoang@cinema.com',
    'hoa.vu@cinema.com',
    'khoa.dang@cinema.com',
    'lan.bui@cinema.com',
    'minh.ngo@cinema.com',
    'nga.do@cinema.com',
    'phuc.trinh@cinema.com'
);

-- Nhóm role = 'admin' -> mật khẩu: admin123
UPDATE employees
SET password = '$2b$12$/cVy9WlzM63lNrgv/sMjp.H.FeCyoasdmB/o1b5INFp2CzGxalq1e',
    role = 'admin'
WHERE email IN (
    'mattroinho@cinema.com',
    'quynh.ly@cinema.com'
);

-- Kiểm tra lại kết quả danh sách nhân viên & phân quyền:
SELECT employee_id, full_name, email, position, role FROM employees;

-- ==========================================================
-- BẢNG TÀI KHOẢN ĐỂ TEST ĐĂNG NHẬP
-- ==========================================================
-- | Email                     | Mật khẩu     | Role     | Chức vụ   |
-- |----------------------------|--------------|----------|-----------|
-- | cuong.le@cinema.com         | nhanvien123 | employee | Nhân viên |
-- | dung.pham@cinema.com        | nhanvien123 | employee | Thu ngân  |
-- | em.hoang@cinema.com         | nhanvien123 | employee | Bảo vệ    |
-- | hoa.vu@cinema.com           | nhanvien123 | employee | Thu ngân  |
-- | khoa.dang@cinema.com        | nhanvien123 | employee | Nhân viên |
-- | lan.bui@cinema.com          | nhanvien123 | employee | Nhân viên |
-- | minh.ngo@cinema.com         | nhanvien123 | employee | Bảo vệ    |
-- | nga.do@cinema.com           | nhanvien123 | employee | Thu ngân  |
-- | phuc.trinh@cinema.com       | nhanvien123 | employee | Nhân viên |
-- | mattroinho@cinema.com       | admin123    | admin    | Admin     |
-- | quynh.ly@cinema.com         | admin123    | admin    | Quản lý   |
