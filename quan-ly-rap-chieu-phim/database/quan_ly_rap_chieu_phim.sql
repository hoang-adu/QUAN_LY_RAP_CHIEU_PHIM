
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
    room_type  VARCHAR(50),                   -- '2D', '3D', 'IMAX', ...
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
    position     VARCHAR(50),                 -- VD: 'Thu ngân', 'Bảo vệ', 'Nhân viên', 'Admin'
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

-- Movies
INSERT INTO movies (title, genre, duration, director, actors, release_date, description, poster) VALUES
('Avengers: Endgame', 'Action', 181, 'Anthony Russo', 'Robert Downey Jr., Chris Evans', '2019-04-26', 'Siêu anh hùng đối đầu Thanos', 'avengers.jpg'),
('Interstellar',      'Sci-Fi', 169, 'Christopher Nolan', 'Matthew McConaughey', '2014-11-07', 'Hành trình vũ trụ', 'interstellar.jpg');

-- Rooms
INSERT INTO rooms (room_name, room_type, seat_count) VALUES
('Phòng 1', '2D', 100),
('Phòng 2', '3D', 80),
('Phòng 3', 'IMAX', 60);

-- Seats
INSERT INTO seats (room_id, seat_number, seat_type) VALUES
(1, 'A1', 'standard'), (1, 'A2', 'standard'), (1, 'B1', 'vip'),
(2, 'A1', 'standard'), (2, 'A2', '3D');

-- Customers
INSERT INTO customers (full_name, phone, email, password, points) VALUES
('Nguyễn Văn An', '0901234567', 'an.nguyen@email.com', 'hashed_pw_1', 100),
('Trần Thị Bình', '0912345678', 'binh.tran@email.com', 'hashed_pw_2', 50);

-- Employees
-- Lưu ý: password đặt tạm 'CHANGE_ME' ngay khi tạo để tránh NULL;
-- file seed_employee_auth.sql sẽ UPDATE lại thành hash bcrypt thật.
INSERT INTO employees (full_name, phone, email, password, position, role) VALUES
('Lê Văn Cường',   '0923456789', 'cuong.le@cinema.com',    'CHANGE_ME', 'Nhân viên', 'employee'),
('Phạm Thị Dung',  '0934567890', 'dung.pham@cinema.com',   'CHANGE_ME', 'Thu ngân',  'employee'),
('Hoàng Văn Em',   '0945678901', 'em.hoang@cinema.com',    'CHANGE_ME', 'Bảo vệ',    'employee'),
('Mặt Trời Nhỏ',   '0956789012', 'mattroinho@cinema.com',  'CHANGE_ME', 'Admin',     'admin');

-- Showtimes
INSERT INTO showtimes (movie_id, room_id, show_date, start_time, end_time) VALUES
(1, 1, '2025-06-01', '09:00:00', '12:01:00'),
(1, 2, '2025-06-01', '14:00:00', '17:01:00'),
(2, 3, '2025-06-02', '19:00:00', '21:49:00');

-- Bookings
INSERT INTO bookings (customer_id, total_amount, status) VALUES
(1, 150000.00, 'confirmed'),
(2, 90000.00,  'pending');

-- Tickets
INSERT INTO tickets (booking_id, showtime_id, seat_id, ticket_price) VALUES
(1, 1, 1, 75000.00),
(1, 1, 2, 75000.00),
(2, 2, 4, 90000.00);

-- Payments
INSERT INTO payments (booking_id, amount, payment_method, payment_status) VALUES
(1, 150000.00, 'momo', 'paid'),
(2, 90000.00,  'cash', 'pending');

-- Products
INSERT INTO products (product_name, price, stock_quantity) VALUES
('Bắp rang bơ lớn', 45000.00, 200),
('Coca-Cola',        25000.00, 300),
('Combo đôi',        85000.00, 100);

-- Food Orders
INSERT INTO food_orders (customer_id, total_amount) VALUES
(1, 70000.00),
(2, 85000.00);

-- Food Order Details
INSERT INTO food_order_details (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 45000.00),
(1, 2, 1, 25000.00),
(2, 3, 1, 85000.00);
