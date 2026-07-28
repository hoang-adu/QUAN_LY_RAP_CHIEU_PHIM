// src/pages/TicketCheckInPage.jsx
// Nhân viên/Admin (kể cả Bảo vệ ở cửa soát vé) nhập MÃ VÉ khách đưa tại
// quầy -> tra cứu để xem trước thông tin (phim, suất chiếu, ghế, khách
// hàng) -> xác nhận đã đưa vé thật. Chặn xác nhận 2 lần cho cùng 1 mã.
import React, { useMemo, useState } from "react";
import useApiList from "../api/useApiList";
import { lookupTicketsByCode, checkInByCode } from "../api/tickets";
import { useToast } from "../components/ToastContext";
import "./table.css";
import "../components/ui.css";

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
}

export default function TicketCheckInPage() {
  const toast = useToast();
  const movies = useApiList("movies");
  const rooms = useApiList("rooms");
  const showtimes = useApiList("showtimes");
  const seats = useApiList("seats");
  const bookings = useApiList("bookings");
  const customers = useApiList("customers");

  const [code, setCode] = useState("");
  const [tickets, setTickets] = useState(null); // null = chưa tra cứu lần nào
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notFound, setNotFound] = useState(false);

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
  const bookingById = useMemo(
    () => Object.fromEntries(bookings.rows.map((b) => [String(b.booking_id), b])),
    [bookings.rows],
  );
  const customerById = useMemo(
    () => Object.fromEntries(customers.rows.map((c) => [String(c.customer_id), c])),
    [customers.rows],
  );

  const booking = tickets?.length ? bookingById[String(tickets[0].booking_id)] : null;
  const customer = booking ? customerById[String(booking.customer_id)] : null;
  const allPickedUp = !!tickets?.length && tickets.every((t) => t.is_picked_up);
  const totalAmount = (tickets || []).reduce(
    (sum, t) => sum + Number(t.ticket_price || 0),
    0,
  );

  async function handleSearch(e) {
    e?.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Vui lòng nhập mã vé.");
      return;
    }
    setSearching(true);
    setNotFound(false);
    try {
      const result = await lookupTicketsByCode(trimmed);
      setTickets(result);
    } catch (err) {
      setTickets(null);
      setNotFound(true);
      toast.error(err.message || "Không tìm thấy vé với mã này.");
    } finally {
      setSearching(false);
    }
  }

  async function handleConfirm() {
    const trimmed = code.trim().toUpperCase();
    setConfirming(true);
    try {
      const result = await checkInByCode(trimmed);
      setTickets(result);
      toast.success(`Đã xác nhận đưa vé cho mã "${trimmed}" (${result.length} ghế).`);
    } catch (err) {
      toast.error(err.message || "Xác nhận thất bại.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Nhận vé tại quầy</div>
          <div className="page-sub">
            Nhập mã vé khách đưa (vé đặt online) để tra cứu và xác nhận đã đưa vé thật
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, maxWidth: 420, marginBottom: 20 }}>
        <div className="ui-field" style={{ flex: 1, marginBottom: 0 }}>
          <input
            placeholder="Nhập mã vé, vd. VE-8K3F2Q"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ textTransform: "uppercase" }}
          />
        </div>
        <button className="ui-btn ui-btn-primary" type="submit" disabled={searching}>
          {searching ? "Đang tra cứu..." : "Tra cứu"}
        </button>
      </form>

      {notFound && (
        <div className="et-status">Không tìm thấy vé nào với mã vé này. Kiểm tra lại mã (không phân biệt hoa/thường).</div>
      )}

      {tickets && tickets.length > 0 && (
        <div className="et-table-wrap" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div><b>Đơn đặt vé:</b> #{tickets[0].booking_id}</div>
              <div><b>Khách hàng:</b> {customer?.full_name || "—"} · {customer?.phone || "—"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div><b>Tổng tiền:</b> {totalAmount.toLocaleString("vi-VN")} đ</div>
              <div>
                {allPickedUp ? (
                  <span className="et-badge ok">
                    Đã nhận vé lúc {formatDateTime(tickets[0].picked_up_at)}
                  </span>
                ) : (
                  <span className="et-badge pending">Chưa nhận vé</span>
                )}
              </div>
            </div>
          </div>

          <table className="et-table">
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Phim</th>
                <th>Suất chiếu</th>
                <th>Phòng</th>
                <th>Ghế</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const showtime = showtimeById[String(t.showtime_id)];
                const movie = showtime ? movieById[String(showtime.movie_id)] : null;
                const room = showtime ? roomById[String(showtime.room_id)] : null;
                const seat = seatById[String(t.seat_id)];
                return (
                  <tr key={t.ticket_id}>
                    <td>{t.ticket_code}</td>
                    <td>{movie?.title || `#${showtime?.movie_id ?? "?"}`}</td>
                    <td>
                      {showtime
                        ? `${showtime.show_date} · ${showtime.start_time?.slice(0, 5)}`
                        : `#${t.showtime_id}`}
                    </td>
                    <td>{room?.room_name || `#${showtime?.room_id ?? "?"}`}</td>
                    <td>{seat?.seat_number || `#${t.seat_id}`}</td>
                    <td>{Number(t.ticket_price || 0).toLocaleString("vi-VN")} đ</td>
                    <td>
                      {t.is_picked_up ? (
                        <span className="et-badge ok">Đã nhận</span>
                      ) : (
                        <span className="et-badge pending">Chưa nhận</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: 16 }}>
            <button
              className="ui-btn ui-btn-primary"
              disabled={confirming || allPickedUp}
              onClick={handleConfirm}
            >
              {allPickedUp
                ? "Đã xác nhận đưa vé"
                : confirming
                  ? "Đang xác nhận..."
                  : `Xác nhận đã đưa vé (${tickets.length} ghế)`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}