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
