// src/pages/CustomerAccountPage.jsx
// Trang tài khoản dành cho khách hàng sau khi đăng nhập (không dùng chung
// dashboard Sidebar/Topbar của Admin/Nhân viên — khách hàng không có quyền
// truy cập các trang quản trị). Giao diện thiết kế lại theo phong cách
// CGV / Lotte Cinema: thẻ thành viên bên trái, danh sách vé dạng "vé xé".
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getAuth } from "../api/auth";
import useApiList from "../api/useApiList";
import { resolveAssetUrl } from "../api/apiClient";
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

// Ảnh poster thật của phim trên vé; rơi về icon 🎬 nếu chưa có poster
// hoặc link ảnh lỗi.
function TicketPoster({ src, alt }) {
  const [broken, setBroken] = React.useState(false);
  const resolvedSrc = src ? resolveAssetUrl(src) : null;
  if (!resolvedSrc || broken) {
    return <div className="ac-ticket__poster">🎬</div>;
  }
  return (
    <img
      className="ac-ticket__poster ac-ticket__poster--img"
      src={resolvedSrc}
      alt={alt}
      onError={() => setBroken(true)}
    />
  );
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

  const upcomingCount = ticketGroups.filter((g) => !g.tickets.every((t) => t.is_picked_up)).length;

  const busy =
    tickets.loading || bookings.loading || movies.loading || showtimes.loading ||
    rooms.loading || seats.loading;

  return (
    <CustomerLayout>
      <div className="ac-wrap">
        {/* Thẻ thành viên */}
        <div className="ac-membercard">
          <div className="ac-membercard__top">
            <span className="ac-membercard__brand">RẠP PHIM MẶT TRỜI NHỎ</span>
            <span className="ac-membercard__tier">THÀNH VIÊN</span>
          </div>
          <div className="ac-membercard__avatar">
            {(auth?.full_name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="ac-membercard__name">{auth?.full_name || "Khách hàng"}</div>
          <div className="ac-membercard__points">
            <span>⭐ Điểm tích lũy</span>
            <strong>{auth?.points ?? 0}</strong>
          </div>
          <div className="ac-membercard__grid">
            <div>
              <span>Email</span>
              <strong>{auth?.email || "—"}</strong>
            </div>
            <div>
              <span>Số điện thoại</span>
              <strong>{auth?.phone || "—"}</strong>
            </div>
          </div>
          <Link to="/book" className="ac-membercard__cta">
            🎬 Đặt vé xem phim
          </Link>
        </div>

        {/* Danh sách vé */}
        <div className="ac-tickets">
          <div className="ac-tickets__head">
            <h3>Vé của tôi</h3>
            {upcomingCount > 0 && <span className="ac-badge">{upcomingCount} vé chưa nhận</span>}
          </div>

          {busy ? (
            <div className="ac-empty">Đang tải danh sách vé...</div>
          ) : ticketGroups.length === 0 ? (
            <div className="ac-empty">
              <span className="ac-empty__icon">🎟️</span>
              Bạn chưa đặt vé nào.
              <Link to="/book">Đặt vé ngay</Link>
            </div>
          ) : (
            <div className="ac-ticket-list">
              {ticketGroups.map((group) => {
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
                  <div className={"ac-ticket" + (pickedUp ? " picked" : "")} key={group.code}>
                    <div className="ac-ticket__main">
                      <TicketPoster src={movie?.poster} alt={movie?.title} />
                      <div className="ac-ticket__body">
                        <div className="ac-ticket__title-row">
                          <strong>{movie?.title || "Phim #" + (firstShowtime?.movie_id ?? "?")}</strong>
                          <span className={"ac-status" + (pickedUp ? " picked" : "")}>
                            {pickedUp ? "✅ Đã nhận vé" : "⏳ Chưa nhận"}
                          </span>
                        </div>
                        <div className="ac-ticket__meta">
                          🕒 {firstShowtime ? `${formatDate(firstShowtime.show_date)} · ${firstShowtime.start_time?.slice(0, 5)}` : "—"}
                          {"  ·  "}🏛️ {room?.room_name || (firstShowtime ? `Phòng #${firstShowtime.room_id}` : "—")}
                        </div>
                        <div className="ac-ticket__meta">💺 Ghế: {seatNumbers.join(", ") || "—"}</div>
                        {pickedUp && pickedAt && (
                          <div className="ac-ticket__meta">Đã nhận lúc {pickedAt}</div>
                        )}
                      </div>
                    </div>
                    <div className="ac-ticket__stub">
                      <div className="ac-ticket__code-label">Mã vé</div>
                      <div className="ac-ticket__code">{group.tickets[0]?.ticket_code || "—"}</div>
                      <div className="ac-ticket__order">Đơn #{group.tickets[0]?.booking_id}</div>
                      <div className="ac-ticket__price">{totalPrice.toLocaleString("vi-VN")} đ</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}