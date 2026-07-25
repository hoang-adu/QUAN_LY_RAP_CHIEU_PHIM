-- ==========================================================
-- 1. Bảng phim (movies)
CREATE TABLE movies (
    movie_id      INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    genre         VARCHAR(100),
    duration      INT,                        -- Thời lượng (phút)
    director      VARCHAR(255),
    actors        TEXT,
    release_date  DATE,
    description   TEXT,
    poster        VARCHAR(255)
);

-- 2. Bảng phòng chiếu (rooms)
CREATE TABLE rooms (
    room_id    INT AUTO_INCREMENT PRIMARY KEY,
    room_name  VARCHAR(50)  NOT NULL,
    room_type  VARCHAR(50),                   -- '2D', '3D', 'IMAX', 'Deluxe', ...
    seat_count INT
);

-- 3. Bảng ghế (seats)
CREATE TABLE seats (
    seat_id      INT AUTO_INCREMENT PRIMARY KEY,
    room_id      INT         NOT NULL,
    seat_number  VARCHAR(10) NOT NULL,        -- VD: A1, B2, ...
    seat_type    VARCHAR(20) DEFAULT 'standard', -- 'standard', 'vip', 'couple'
    UNIQUE KEY uq_seat_room (room_id, seat_number),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE RESTRICT
);

-- 4. Bảng khách hàng (customers)
CREATE TABLE customers (
    customer_id  INT AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    phone        VARCHAR(20),
    email        VARCHAR(100) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    points       INT DEFAULT 0                -- Điểm tích lũy
);

-- 5. Bảng nhân viên (employees)
CREATE TABLE employees (
    employee_id  INT AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    phone        VARCHAR(20),
    email        VARCHAR(100) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    position     VARCHAR(50),                 -- VD: 'Thu ngân', 'Bảo vệ', 'Nhân viên', 'Quản lý', 'Admin'
    role         ENUM('admin', 'employee') NOT NULL DEFAULT 'employee'
);

-- 6. Bảng suất chiếu (showtimes)
CREATE TABLE showtimes (
    showtime_id  INT AUTO_INCREMENT PRIMARY KEY,
    movie_id     INT  NOT NULL,
    room_id      INT  NOT NULL,
    show_date    DATE NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    UNIQUE KEY uq_room_datetime (room_id, show_date, start_time),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id)  REFERENCES rooms(room_id)   ON DELETE RESTRICT
);

-- 7. Bảng đặt vé (bookings)
CREATE TABLE bookings (
    booking_id    INT AUTO_INCREMENT PRIMARY KEY,
    customer_id   INT          NOT NULL,
    booking_date  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    total_amount  DECIMAL(10,2) DEFAULT 0,
    status        ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT
);

-- 8. Bảng vé (tickets)
CREATE TABLE tickets (
    ticket_id     INT AUTO_INCREMENT PRIMARY KEY,
    booking_id    INT           NOT NULL,
    showtime_id   INT           NOT NULL,
    seat_id       INT           NOT NULL,
    ticket_price  DECIMAL(10,2) NOT NULL,
    -- Chống bán trùng ghế cho cùng 1 suất chiếu
    UNIQUE KEY uq_seat_showtime (showtime_id, seat_id),
    FOREIGN KEY (booking_id)  REFERENCES bookings(booking_id)   ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE RESTRICT,
    FOREIGN KEY (seat_id)     REFERENCES seats(seat_id)         ON DELETE RESTRICT
);

-- 9. Bảng thanh toán (payments)
CREATE TABLE payments (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT          NOT NULL,
    payment_date    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    amount          DECIMAL(10,2) NOT NULL,
    payment_method  ENUM('cash', 'card', 'momo') NOT NULL,
    payment_status  ENUM('paid', 'pending', 'failed') NOT NULL DEFAULT 'pending',
    -- Giữ lại chứng từ thanh toán ngay cả khi booking bị xóa
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE RESTRICT
);

-- 10. Bảng sản phẩm đồ ăn (products)
CREATE TABLE products (
    product_id      INT AUTO_INCREMENT PRIMARY KEY,
    product_name    VARCHAR(100) NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    stock_quantity  INT DEFAULT 0
);

-- 11. Bảng hóa đơn đồ ăn (food_orders)
CREATE TABLE food_orders (
    order_id      INT AUTO_INCREMENT PRIMARY KEY,
    customer_id   INT,
    order_date    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    total_amount  DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
);

-- 12. Chi tiết hóa đơn đồ ăn (food_order_details)
CREATE TABLE food_order_details (
    order_id    INT,
    product_id  INT,
    quantity    INT NOT NULL DEFAULT 1,
    unit_price  DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id)   REFERENCES food_orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)  ON DELETE RESTRICT
);

-- ==================== DỮ LIỆU MẪU ====================

-- Movies (14 phim, movie_id 1..14)
INSERT INTO movies (title, genre, duration, director, actors, release_date, description, poster) VALUES
('Avengers: Endgame', 'Action', 181, 'Anthony Russo', 'Robert Downey Jr., Chris Evans', '2019-04-26', 'Siêu anh hùng đối đầu Thanos', 'avengers.jpg'),
('Interstellar', 'Sci-Fi', 169, 'Christopher Nolan', 'Matthew McConaughey', '2014-11-07', 'Hành trình vũ trụ', 'interstellar.jpg'),
('Spider-Man: No Way Home', 'Action', 148, 'Jon Watts', 'Tom Holland, Zendaya, Benedict Cumberbatch', '2021-12-17', 'Peter Parker nhờ Doctor Strange xóa ký ức mọi người biết mình là Spider-Man', 'spiderman_nwh.jpg'),
('Inception', 'Sci-Fi', 148, 'Christopher Nolan', 'Leonardo DiCaprio, Joseph Gordon-Levitt', '2010-07-16', 'Kẻ trộm xâm nhập giấc mơ để đánh cắp bí mật', 'inception.jpg'),
('The Dark Knight', 'Action', 152, 'Christopher Nolan', 'Christian Bale, Heath Ledger', '2008-07-18', 'Batman đối đầu với Joker tại Gotham', 'dark_knight.jpg'),
('Parasite', 'Drama', 132, 'Bong Joon-ho', 'Song Kang-ho, Lee Sun-kyun', '2019-05-30', 'Câu chuyện về hai gia đình đối lập giai cấp', 'parasite.jpg'),
('Frozen II', 'Animation', 103, 'Chris Buck', 'Kristen Bell, Idina Menzel', '2019-11-22', 'Elsa và Anna khám phá nguồn gốc sức mạnh phép thuật', 'frozen2.jpg'),
('Joker', 'Drama', 122, 'Todd Phillips', 'Joaquin Phoenix', '2019-10-04', 'Nguồn gốc của gã hề tội phạm khét tiếng Gotham', 'joker.jpg'),
('Dune', 'Sci-Fi', 155, 'Denis Villeneuve', 'Timothée Chalamet, Zendaya', '2021-10-22', 'Cuộc chiến giành quyền kiểm soát hành tinh sa mạc Arrakis', 'dune.jpg'),
('La La Land', 'Romance', 128, 'Damien Chazelle', 'Ryan Gosling, Emma Stone', '2016-12-09', 'Chuyện tình giữa một nhạc công jazz và một diễn viên trẻ', 'lalaland.jpg'),
('Doraemon: Nobita và Mặt Trăng Kỳ Diệu', 'Animation', 111, 'Shinnosuke Yakuwa', 'Lồng tiếng: Wasabi Mizuta', '2019-03-01', 'Nobita cùng nhóm bạn khám phá vương quốc trên Mặt Trăng', 'doraemon_moon.jpg'),
('Mai', 'Drama', 131, 'Trấn Thành', 'Phương Anh Đào, Tuấn Trần', '2024-02-10', 'Câu chuyện tình yêu và những vết thương quá khứ của Mai', 'mai.jpg'),
('Bố Già', 'Comedy', 128, 'Trấn Thành', 'Trấn Thành, Tuấn Trần', '2021-03-12', 'Chuyện gia đình xoay quanh ông ba Sang và con trai', 'bogia.jpg'),
('Đất Rừng Phương Nam', 'Adventure', 130, 'Nguyễn Quang Dũng', 'Hạo Khang, Tuấn Trần', '2023-10-13', 'Hành trình phiêu lưu của cậu bé An ở miền Tây Nam Bộ', 'datrungphuongnam.jpg');

-- Rooms (5 phòng, room_id 1..5)
INSERT INTO rooms (room_name, room_type, seat_count) VALUES
('Phòng 1', '2D', 22),
('Phòng 2', '3D', 20),
('Phòng 3', 'IMAX', 25),
('Phòng 4', '2D', 10),
('Phòng 5', 'Deluxe', 10);

-- Seats (87 ghế, seat_id 1..87)
-- Phòng 1 (room_id 1): seat_id 1..22
INSERT INTO seats (room_id, seat_number, seat_type) VALUES
(1, 'A1', 'standard'),
(1, 'A2', 'standard'),
(1, 'B1', 'vip'),
(1, 'B2', 'vip'),
(1, 'B3', 'vip'),
(1, 'B4', 'vip'),
(1, 'B5', 'vip'),
(1, 'B6', 'vip'),
(1, 'B7', 'vip'),
(1, 'B8', 'vip'),
(1, 'B9', 'vip'),
(1, 'B10', 'vip'),
(1, 'C1', 'standard'),
(1, 'C2', 'standard'),
(1, 'C3', 'standard'),
(1, 'C4', 'standard'),
(1, 'C5', 'standard'),
(1, 'C6', 'standard'),
(1, 'C7', 'standard'),
(1, 'C8', 'standard'),
(1, 'C9', 'standard'),
(1, 'C10', 'standard');

-- Phòng 2 (room_id 2): seat_id 23..42
INSERT INTO seats (room_id, seat_number, seat_type) VALUES
(2, 'A1', 'standard'),
(2, 'A2', '3D'),
(2, 'A3', '3D'),
(2, 'A4', '3D'),
(2, 'A5', '3D'),
(2, 'A6', '3D'),
(2, 'A7', '3D'),
(2, 'A8', '3D'),
(2, 'A9', '3D'),
(2, 'A10', '3D'),
(2, 'B1', 'couple'),
(2, 'B2', 'couple'),
(2, 'B3', 'couple'),
(2, 'B4', 'couple'),
(2, 'B5', 'couple'),
(2, 'B6', 'couple'),
(2, 'B7', 'couple'),
(2, 'B8', 'couple'),
(2, 'B9', 'couple'),
(2, 'B10', 'couple');

-- Phòng 3 (room_id 3): seat_id 43..67
INSERT INTO seats (room_id, seat_number, seat_type) VALUES
(3, 'A1', 'standard'),
(3, 'A2', 'standard'),
(3, 'A3', 'standard'),
(3, 'A4', 'standard'),
(3, 'A5', 'standard'),
(3, 'A6', 'standard'),
(3, 'A7', 'standard'),
(3, 'A8', 'standard'),
(3, 'A9', 'standard'),
(3, 'A10', 'standard'),
(3, 'B1', 'vip'),
(3, 'B2', 'vip'),
(3, 'B3', 'vip'),
(3, 'B4', 'vip'),
(3, 'B5', 'vip'),
(3, 'B6', 'vip'),
(3, 'B7', 'vip'),
(3, 'B8', 'vip'),
(3, 'B9', 'vip'),
(3, 'B10', 'vip'),
(3, 'C1', 'couple'),
(3, 'C2', 'couple'),
(3, 'C3', 'couple'),
(3, 'C4', 'couple'),
(3, 'C5', 'couple');

-- Phòng 4 (room_id 4): seat_id 68..77
INSERT INTO seats (room_id, seat_number, seat_type) VALUES
(4, 'A1', 'standard'),
(4, 'A2', 'standard'),
(4, 'A3', 'standard'),
(4, 'A4', 'standard'),
(4, 'A5', 'standard'),
(4, 'A6', 'standard'),
(4, 'A7', 'standard'),
(4, 'A8', 'standard'),
(4, 'A9', 'standard'),
(4, 'A10', 'standard');

-- Phòng 5 (room_id 5): seat_id 78..87
INSERT INTO seats (room_id, seat_number, seat_type) VALUES
(5, 'A1', 'standard'),
(5, 'A2', 'standard'),
(5, 'A3', 'standard'),
(5, 'A4', 'standard'),
(5, 'A5', 'standard'),
(5, 'A6', 'standard'),
(5, 'A7', 'standard'),
(5, 'A8', 'standard'),
(5, 'A9', 'standard'),
(5, 'A10', 'standard');

-- Customers (10 khách hàng, customer_id 1..10)
INSERT INTO customers (full_name, phone, email, password, points) VALUES
('Nguyễn Văn An', '0901234567', 'an.nguyen@email.com', 'hashed_pw_1', 100),
('Trần Thị Bình', '0912345678', 'binh.tran@email.com', 'hashed_pw_2', 50),
('Phan Thị Hạnh', '0971111111', 'hanh.phan@email.com', 'hashed_pw_3', 20),
('Đinh Văn Hải', '0972222222', 'hai.dinh@email.com', 'hashed_pw_4', 0),
('Vương Thị Huệ', '0973333333', 'hue.vuong@email.com', 'hashed_pw_5', 320),
('Lâm Văn Kiên', '0974444444', 'kien.lam@email.com', 'hashed_pw_6', 15),
('Tô Thị Loan', '0975555555', 'loan.to@email.com', 'hashed_pw_7', 60),
('Chu Văn Nam', '0976666666', 'nam.chu@email.com', 'hashed_pw_8', 5),
('Mai Thị Oanh', '0977777777', 'oanh.mai@email.com', 'hashed_pw_9', 150),
('Hồ Văn Phong', '0978888888', 'phong.ho@email.com', 'hashed_pw_10', 0);

-- Employees (11 nhân viên, employee_id 1..11)
-- Lưu ý: password đặt tạm 'CHANGE_ME' ngay khi tạo để tránh NULL;
-- file seed_employee_auth.sql sẽ UPDATE lại thành hash bcrypt thật.
INSERT INTO employees (full_name, phone, email, password, position, role) VALUES
('Lê Văn Cường', '0923456789', 'cuong.le@cinema.com', 'CHANGE_ME', 'Nhân viên', 'employee'),
('Phạm Thị Dung', '0934567890', 'dung.pham@cinema.com', 'CHANGE_ME', 'Thu ngân', 'employee'),
('Hoàng Văn Em', '0945678901', 'em.hoang@cinema.com', 'CHANGE_ME', 'Bảo vệ', 'employee'),
('Mặt Trời Nhỏ', '0956789012', 'mattroinho@cinema.com', 'CHANGE_ME', 'Admin', 'admin'),
('Vũ Thị Hoa', '0961111111', 'hoa.vu@cinema.com', 'CHANGE_ME', 'Thu ngân', 'employee'),
('Đặng Văn Khoa', '0962222222', 'khoa.dang@cinema.com', 'CHANGE_ME', 'Nhân viên', 'employee'),
('Bùi Thị Lan', '0963333333', 'lan.bui@cinema.com', 'CHANGE_ME', 'Nhân viên', 'employee'),
('Ngô Văn Minh', '0964444444', 'minh.ngo@cinema.com', 'CHANGE_ME', 'Bảo vệ', 'employee'),
('Đỗ Thị Nga', '0965555555', 'nga.do@cinema.com', 'CHANGE_ME', 'Thu ngân', 'employee'),
('Trịnh Văn Phúc', '0966666666', 'phuc.trinh@cinema.com', 'CHANGE_ME', 'Nhân viên', 'employee'),
('Lý Thị Quỳnh', '0967777777', 'quynh.ly@cinema.com', 'CHANGE_ME', 'Quản lý', 'admin');

-- Showtimes (15 suất chiếu, showtime_id 1..15)
INSERT INTO showtimes (movie_id, room_id, show_date, start_time, end_time) VALUES
(1, 1, '2025-06-01', '09:00:00', '12:01:00'),
(1, 2, '2025-06-01', '14:00:00', '17:01:00'),
(2, 3, '2025-06-02', '19:00:00', '21:49:00'),
(3, 1, '2025-06-03', '09:30:00', '11:58:00'),
(3, 4, '2025-06-03', '19:00:00', '21:28:00'),
(4, 2, '2025-06-03', '13:00:00', '15:28:00'),
(5, 3, '2025-06-04', '20:00:00', '22:32:00'),
(6, 5, '2025-06-04', '17:30:00', '19:42:00'),
(7, 1, '2025-06-05', '10:00:00', '11:43:00'),
(8, 4, '2025-06-05', '21:00:00', '23:02:00'),
(9, 3, '2025-06-06', '18:00:00', '20:35:00'),
(12, 2, '2025-06-06', '15:00:00', '17:11:00'),
(13, 5, '2025-06-07', '14:00:00', '16:08:00'),
(14, 1, '2025-06-07', '19:30:00', '21:40:00'),
(11, 4, '2025-06-08', '09:00:00', '10:51:00');

-- Bookings (10 booking, booking_id 1..10)
INSERT INTO bookings (customer_id, total_amount, status) VALUES
(1, 150000.00, 'confirmed'),
(2, 90000.00, 'pending'),
(3, 200000.00, 'confirmed'),
(4, 110000.00, 'confirmed'),
(5, 450000.00, 'confirmed'),
(6, 170000.00, 'pending'),
(7, 75000.00, 'confirmed'),
(8, 200000.00, 'confirmed'),
(9, 600000.00, 'cancelled'),
(10, 200000.00, 'confirmed');

-- Tickets (16 vé, ticket_id 1..16)
INSERT INTO tickets (booking_id, showtime_id, seat_id, ticket_price) VALUES
(1, 1, 1, 75000.00),
(1, 1, 2, 75000.00),
(2, 2, 23, 90000.00),
(3, 4, 13, 100000.00),
(3, 4, 14, 100000.00),
(4, 6, 25, 110000.00),
(5, 7, 53, 150000.00),
(5, 7, 54, 150000.00),
(5, 7, 55, 150000.00),
(6, 8, 78, 85000.00),
(6, 8, 79, 85000.00),
(7, 9, 15, 75000.00),
(8, 10, 68, 100000.00),
(8, 10, 69, 100000.00),
(10, 12, 33, 100000.00),
(10, 12, 34, 100000.00);
-- (booking 9 đã hủy nên không có vé)

-- Payments (10 thanh toán, payment_id 1..10)
INSERT INTO payments (booking_id, amount, payment_method, payment_status) VALUES
(1, 150000.00, 'momo', 'paid'),
(2, 90000.00, 'cash', 'pending'),
(3, 200000.00, 'card', 'paid'),
(4, 110000.00, 'momo', 'paid'),
(5, 450000.00, 'cash', 'paid'),
(6, 170000.00, 'momo', 'pending'),
(7, 75000.00, 'card', 'paid'),
(8, 200000.00, 'cash', 'paid'),
(9, 600000.00, 'card', 'failed'),
(10, 200000.00, 'momo', 'paid');

-- Products (7 sản phẩm, product_id 1..7)
INSERT INTO products (product_name, price, stock_quantity) VALUES
('Bắp rang bơ lớn', 45000.00, 200),
('Coca-Cola', 25000.00, 300),
('Combo đôi', 85000.00, 100),
('Bắp rang bơ nhỏ', 30000.00, 250),
('Bắp rang phô mai', 50000.00, 150),
('Pepsi', 25000.00, 300),
('Combo 1 (Bắp + Nước)', 65000.00, 120);

-- Food Orders (6 hóa đơn, order_id 1..6)
INSERT INTO food_orders (customer_id, total_amount) VALUES
(1, 70000.00),
(2, 85000.00),
(3, 95000.00),
(5, 65000.00),
(7, 60000.00),
(10, 130000.00);

-- Food Order Details
INSERT INTO food_order_details (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 45000.00),
(1, 2, 1, 25000.00),
(2, 3, 1, 85000.00),
(3, 5, 1, 50000.00),
(3, 6, 1, 25000.00),
(4, 7, 1, 65000.00),
(5, 4, 2, 30000.00),
(6, 5, 2, 50000.00),
(6, 6, 1, 25000.00);
