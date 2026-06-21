#  Quản Lý Rạp Chiếu Phim

---

##  Phân công nhóm

| Thành viên | Phần phụ trách | Bảng CSDL |
|---|---|---|
| TV1: Lê Thị Phương Anh (Trưởng nhóm) | movies, rooms, seats, customers | 1 – 4 |
| TV2: Nguyễn Việt Hoàng | employees, showtimes, bookings, tickets | 5 – 8 |
| TV3: Lê Phan Huyền Trang | payments, products, food-orders | 9 – 12 |

---

##  Cơ sở dữ liệu

Gồm 12 bảng:
1. `movies` — Phim
2. `rooms` — Phòng chiếu
3. `seats` — Ghế ngồi
4. `customers` — Khách hàng
5. `employees` — Nhân viên
6. `showtimes` — Suất chiếu
7. `bookings` — Đặt vé
8. `tickets` — Vé
9. `payments` — Thanh toán
10. `products` — Sản phẩm đồ ăn
11. `food_orders` — Hóa đơn đồ ăn
12. `food_order_details` — Chi tiết hóa đơn đồ ăn


##  Công nghệ sử dụng

- **Framework:** NestJS
- **Database:** MySQL (sử dụng Docker)
- **ORM:** TypeORM
- **Validation:** class-validator, class-transformer
- **Language:** TypeScript





#  Tickets  — CRUD cá nhân

**Sinh viên:** Nguyễn việt Hoàng
**Môn:** Web Nâng Cao
**Framework:** NestJS + TypeORM + MySQL

---

## 📌 Đối tượng phụ trách

Đối tượng: Ticket

Vé (`tickets`) là đối tượng trung gian kết nối giữa đơn đặt vé (`bookings`), suất chiếu (`showtimes`) và ghế ngồi (`seats`). Mỗi vé ghi nhận một ghế cụ thể trong một suất chiếu cụ thể thuộc về một đơn đặt vé.

---

##  Cấu trúc bảng CSDL

```sql
CREATE TABLE tickets (
    ticket_id     INT AUTO_INCREMENT PRIMARY KEY,
    booking_id    INT           NOT NULL,
    showtime_id   INT           NOT NULL,
    seat_id       INT           NOT NULL,
    ticket_price  DECIMAL(10,2),
    FOREIGN KEY (booking_id)  REFERENCES bookings(booking_id)   ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id)     REFERENCES seats(seat_id)         ON DELETE CASCADE
);
```

---

##  Cấu trúc file

```
src/tickets/
├── dto/
│   ├── create-ticket.dto.ts   ← Validate dữ liệu khi tạo vé
│   └── update-ticket.dto.ts   ← Validate dữ liệu khi cập nhật
├── ticket.entity.ts           ← Mapping với bảng tickets trong DB
├── tickets.controller.ts      ← Định nghĩa các route API
├── tickets.service.ts         ← Logic xử lý nghiệp vụ
└── tickets.module.ts          ← Khai báo module NestJS
```

---

##  API Endpoints

###  Create — Tạo vé mới

```http
POST /tickets
Content-Type: application/json

{
  "booking_id": 1,
  "showtime_id": 2,
  "seat_id": 3,
  "ticket_price": 75000
}
```

**Phản hồi thành công (201 Created):**
```json
{
  "ticket_id": 5,
  "booking_id": 1,
  "showtime_id": 2,
  "seat_id": 3,
  "ticket_price": "75000.00"
}
```

**Phản hồi lỗi (400 Bad Request — ghế đã được đặt):**
```json
{
  "statusCode": 400,
  "message": "Ghế #3 đã được đặt cho suất chiếu #2"
}
```

---

###  Read — Lấy danh sách / chi tiết vé

**Lấy tất cả vé:**
```http
GET /tickets
```

**Lấy 1 vé theo ID:**
```http
GET /tickets/5
```

**Phản hồi lỗi (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Không tìm thấy vé có ID #99"
}
```

**Lấy vé theo đơn đặt vé:**
```http
GET /tickets/booking/1
```

---

###  Update — Cập nhật vé

```http
PUT /tickets/5
Content-Type: application/json

{
  "ticket_price": 90000
}
```

**Phản hồi thành công (200 OK):**
```json
{
  "ticket_id": 5,
  "booking_id": 1,
  "showtime_id": 2,
  "seat_id": 3,
  "ticket_price": "90000.00"
}
```

---

###  Delete — Xóa vé

```http
DELETE /tickets/5
```

**Phản hồi thành công (200 OK):**
```json
{
  "message": "Đã xóa vé #5 thành công"
}
```

**Phản hồi lỗi (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Không tìm thấy vé có ID #99"
}
```

---

##  Luồng xử lý (Activity Diagram)

Xem file Activity Diagram đính kèm trong thư mục `docs/`.

Tóm tắt luồng xử lý:

| Thao tác | Luồng chính | Luồng lỗi |
|---|---|---|
| **CREATE** | Nhận body → Validate DTO → Kiểm tra trùng ghế → Lưu DB → 201 | 400 (sai dữ liệu / ghế đã đặt) |
| **READ** | Nhận ID → Parse → Truy vấn DB → 200 OK | 404 (không tìm thấy) |
| **UPDATE** | Nhận ID + body → Tìm vé → Kiểm tra trùng → Cập nhật → 200 OK | 404 / 400 |
| **DELETE** | Nhận ID → Tìm vé → Xóa DB → 200 OK | 404 (không tìm thấy) |

---

##  Tích hợp vào AppModule

Thêm `TicketsModule` vào `app.module.ts`:

```typescript
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ... }),
    TicketsModule,
    // ... các module khác
  ],
})
export class AppModule {}
```

---

##  Công nghệ sử dụng

- **NestJS** — Framework backend
- **TypeORM** — ORM kết nối MySQL
- **class-validator** — Validate dữ liệu đầu vào
- **class-transformer** — Transform DTO
- **MySQL** — Hệ quản trị CSDL

---

## Checklist yêu cầu bài

- [x] Entity `Ticket` mapping với bảng `tickets`
- [x] **Create** — `POST /tickets` (201)
- [x] **Read** — `GET /tickets` và `GET /tickets/:id` (200)
- [x] **Update** — `PUT /tickets/:id` (200)
- [x] **Delete** — `DELETE /tickets/:id` (200)
- [x] Xử lý lỗi 404 khi không tìm thấy vé
- [x] Xử lý lỗi 400 khi ghế đã được đặt
- [x] Activity Diagram CRUD
- [x] README cập nhật đầy đủ
- [x] Code commit lên repo
