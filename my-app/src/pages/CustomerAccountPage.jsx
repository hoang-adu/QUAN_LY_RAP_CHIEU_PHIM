// src/pages/CustomerAccountPage.jsx
// Trang tài khoản dành cho khách hàng sau khi đăng nhập (không dùng chung
// dashboard Sidebar/Topbar của Admin/Nhân viên — khách hàng không có quyền
// truy cập các trang quản trị).
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getAuth } from "../api/auth";
import useApiList from "../api/useApiList";
import CustomerLayout from "../layout/CustomerLayout";
import "./customerAccount.css";

function formatDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

export default function CustomerAccountPage() {
  const auth = getAuth();

  // GET /bookings đã tự lọc theo customer đang đăng nhập ở phía backend.
  const bookings = useApiList("bookings");
  // GET /tickets trả về toàn bộ vé (không lọc theo khách) -> lọc lại ở đây
  // theo các booking thuộc về khách này.
  const tickets = useApiList("tickets");
  const movies = useApiList("movies");
  const showtimes = useApiList("showtimes");
  const rooms = useApiList("rooms");
  const seats = useApiList("seats");

  const myBookingIds = useMemo(
    () => new Set(bookings.rows.map((b) => String(b.booking_id))),
    [bookings.rows],
  );

  const showtimeById = useMemo(
    () => Object.fromEntries(showtimes.rows.map((s) => [String(s.showtime_id), s])),
    [showtimes.rows],
  );
  const movieById = useMemo(
    () => Object.fromEntries(movies.rows.map((m) => [String(m.movie_id), m])),
    [movies.rows],
  );
  const roomById = useMemo(
    () => Object.fromEntries(rooms.rows.map((r) => [String(r.room_id), r])),
    [rooms.rows],
  );
  const seatById = useMemo(
    () => Object.fromEntries(seats.rows.map((s) => [String(s.seat_id), s])),
    [seats.rows],
  );

  // Gom vé theo mã vé (mỗi mã vé = 1 lần đặt, có thể nhiều ghế).
  const ticketGroups = useMemo(() => {
    const mine = tickets.rows.filter((t) => myBookingIds.has(String(t.booking_id)));
    const groups = new Map();
    for (const t of mine) {
      const key = t.ticket_code || `booking-${t.booking_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(t);
    }
    return Array.from(groups.entries())
      .map(([code, list]) => ({ code, tickets: list }))
      .sort((a, b) => (b.tickets[0]?.ticket_id || 0) - (a.tickets[0]?.ticket_id || 0));
  }, [tickets.rows, myBookingIds]);

  const busy =
    tickets.loading || bookings.loading || movies.loading || showtimes.loading ||
    rooms.loading || seats.loading;

  return (
    <CustomerLayout>
      <div className="account-page">
        <div className="account-card">
          <div className="account-avatar">
            {(auth?.full_name || "?").charAt(0).toUpperCase()}
          </div>
          <h2>{auth?.full_name || "Khách hàng"}</h2>
          <p className="account-sub">Tài khoản khách hàng</p>

          <div className="account-info">
            <div className="account-info-row">
              <span>Email</span>
              <strong>{auth?.email || "—"}</strong>
            </div>
            <div className="account-info-row">
              <span>Số điện thoại</span>
              <strong>{auth?.phone || "—"}</strong>
            </div>
            <div className="account-info-row">
              <span>Điểm tích lũy</span>
              <strong>{auth?.points ?? 0}</strong>
            </div>
          </div>

          <Link to="/book" className="login-submit account-book-link">
            🎬 Đặt vé xem phim
          </Link>
        </div>

        <div className="account-card" style={{ marginTop: 20, textAlign: "left" }}>
          <h3 style={{ marginBottom: 12 }}>Vé của tôi</h3>
          {busy ? (
            <div className="account-info-row">
              <span>Đang tải...</span>
            </div>
          ) : ticketGroups.length === 0 ? (
            <div className="account-info-row">
              <span>Bạn chưa đặt vé nào.</span>
            </div>
          ) : (
            ticketGroups.map((group) => {
              const pickedUp = group.tickets.every((t) => t.is_picked_up);
              const pickedAt = formatDateTime(group.tickets[0]?.picked_up_at);
              const totalPrice = group.tickets.reduce(
                (sum, t) => sum + Number(t.ticket_price || 0),
                0,
              );

              // Mỗi mã vé chỉ ứng với 1 suất chiếu (khách chọn ghế cho 1
              // suất rồi mới thanh toán) -> lấy suất chiếu từ vé đầu tiên.
              const firstShowtime = showtimeById[String(group.tickets[0]?.showtime_id)];
              const movie = firstShowtime ? movieById[String(firstShowtime.movie_id)] : null;
              const room = firstShowtime ? roomById[String(firstShowtime.room_id)] : null;
              const seatNumbers = group.tickets
                .map((t) => seatById[String(t.seat_id)]?.seat_number)
                .filter(Boolean)
                .sort();

              return (
                <div
                  key={group.code}
                  className="account-info-row"
                  style={{ flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "12px 0" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <strong>{movie?.title || "Phim #" + (firstShowtime?.movie_id ?? "?")}</strong>
                    <span>{pickedUp ? `✅ Đã nhận vé${pickedAt ? " lúc " + pickedAt : ""}` : "⏳ Chưa nhận vé tại quầy"}</span>
                  </div>
                  <span>
                    🕒 {firstShowtime ? `${formatDate(firstShowtime.show_date)} · ${firstShowtime.start_time?.slice(0, 5)}` : "—"}
                    {" · "}🏛️ {room?.room_name || (firstShowtime ? `Phòng #${firstShowtime.room_id}` : "—")}
                  </span>
                  <span>💺 Ghế: {seatNumbers.join(", ") || "—"}</span>
                  <span>Mã vé: <b>{group.tickets[0]?.ticket_code || "—"}</b> · Đơn #{group.tickets[0]?.booking_id} · {totalPrice.toLocaleString("vi-VN")} đ</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}