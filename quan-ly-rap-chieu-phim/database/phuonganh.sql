CREATE TABLE movies (
    movie_id      INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    genre         VARCHAR(100),
    duration      INT,                      
    director      VARCHAR(255),
    actors        TEXT,
    release_date  DATE,
    description   TEXT,
    poster        VARCHAR(255)
);

-- rooms
CREATE TABLE rooms (
    room_id    INT AUTO_INCREMENT PRIMARY KEY,
    room_name  VARCHAR(50)  NOT NULL,
    room_type  VARCHAR(50),                   
    seat_count INT
);

-- seats
CREATE TABLE seats (
    seat_id      INT AUTO_INCREMENT PRIMARY KEY,
    room_id      INT         NOT NULL,
    seat_number  VARCHAR(10),             
    seat_type    VARCHAR(20),                 
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE
);

-- customers
CREATE TABLE customers (
    customer_id  INT AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100),
    phone        VARCHAR(20),
    email        VARCHAR(100) UNIQUE,
    password     VARCHAR(255),
    points       INT DEFAULT 0                
);

-- dữ liệu 
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
('Trần Thị Bình',  '0912345678', 'binh.tran@email.com', 'hashed_pw_2', 50);


