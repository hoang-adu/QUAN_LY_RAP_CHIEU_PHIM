// src/pages/CustomerBookingPage.jsx
// Khách hàng tự đặt vé online: chọn phim -> chọn suất chiếu -> chọn ghế
// -> thanh toán online. Dùng lại đúng logic tạo booking/ticket/payment
// như NewBookingPage.jsx (bên phía nhân viên), chỉ khác customer_id lấy
// thẳng từ tài khoản đang đăng nhập, không cần chọn khách hàng.
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApiList from "../api/useApiList";
import { createItem } from "../api/apiClient";
import { getCustomerId } from "../api/auth";
import { priceForSeatType, SEAT_TYPE_LABELS } from "../utils/seatPricing";
import { useToast } from "../components/ToastContext";
import CustomerLayout from "../layout/CustomerLayout";
import "../layout/layout.css";
import "../pages/table.css";
import "../components/ui.css";
import "../pages/MoviesPage.css";
import "./customerBooking.css";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

export default function CustomerBookingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const customerId = getCustomerId();

  const movies = useApiList("movies");
  const rooms = useApiList("rooms");
  const showtimes = useApiList("showtimes");
  const seats = useApiList("seats");
  const tickets = useApiList("tickets");

  const [movieId, setMovieId] = useState("");
  const [showtimeId, setShowtimeId] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [submitting, setSubmitting] = useState(false);

  const seatById = useMemo(
    () => Object.fromEntries(seats.rows.map((s) => [String(s.seat_id), s])),
    [seats.rows],
  );

  const showtimesForMovie = useMemo(
    () => showtimes.rows.filter((s) => String(s.movie_id) === String(movieId)),
    [showtimes.rows, movieId],
  );

  const currentShowtime = useMemo(
    () => showtimes.rows.find((s) => String(s.showtime_id) === String(showtimeId)),
    [showtimes.rows, showtimeId],
  );

  const roomSeats = useMemo(() => {
    if (!currentShowtime) return [];
    return seats.rows
      .filter((s) => String(s.room_id) === String(currentShowtime.room_id))
      .sort((a, b) => String(a.seat_number).localeCompare(String(b.seat_number)));
  }, [seats.rows, currentShowtime]);

  const takenSeatIds = useMemo(() => {
    if (!showtimeId) return new Set();
    return new Set(
      tickets.rows
        .filter((t) => String(t.showtime_id) === String(showtimeId))
        .map((t) => String(t.seat_id)),
    );
  }, [tickets.rows, showtimeId]);

  function selectMovie(id) {
    setMovieId(id);
    setShowtimeId("");
    setSelectedSeats([]);
  }

  function selectShowtime(id) {
    setShowtimeId(id);
    setSelectedSeats([]);
  }

  function toggleSeat(seat) {
    const id = String(seat.seat_id);
    if (takenSeatIds.has(id)) return;
    setSelectedSeats((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }

  const total = selectedSeats.reduce((sum, seatId) => {
    const seat = seatById[seatId];
    return sum + priceForSeatType(seat?.seat_type);
  }, 0);

  async function handleSubmit() {
    if (!customerId) {
      toast.error("Không xác định được tài khoản, vui lòng đăng nhập lại.");
      return;
    }
    if (selectedSeats.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 ghế.");
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createItem("bookings", {
        customer_id: Number(customerId),
        total_amount: total,
        status: "pending",
      });
      const bookingId = booking.booking_id ?? booking.id;

      for (const seatId of selectedSeats) {
        const seat = seatById[seatId];
        await createItem("tickets", {
          booking_id: bookingId,
          showtime_id: Number(showtimeId),
          seat_id: Number(seatId),
          ticket_price: priceForSeatType(seat?.seat_type),
        });
      }

      await createItem("payments", {
        booking_id: bookingId,
        amount: total,
        payment_method: paymentMethod,
        payment_status: "paid",
      });

      toast.success(`Đặt vé thành công! Đơn #${bookingId} với ${selectedSeats.length} ghế.`);
      navigate("/account", { replace: true });
    } catch (err) {
      toast.error(
        err.message ||
          "Không thể đặt vé — có thể một ghế vừa bị người khác đặt, vui lòng thử lại.",
      );
      tickets.reload();
      setSelectedSeats([]);
    } finally {
      setSubmitting(false);
    }
  }

  const busy = movies.loading || rooms.loading || showtimes.loading;

  return (
    <CustomerLayout>
      <div className="cb-page">
        <div className="page-head">
          <div>
            <div className="page-title">Đặt vé xem phim</div>
            <div className="page-sub">Chọn phim, suất chiếu và ghế ngồi bạn muốn</div>
          </div>
        </div>

        {busy ? (
          <div className="et-status">Đang tải danh sách phim...</div>
        ) : (
          <>
            <div className="section-title">1. Chọn phim</div>
            <div className="mv-card-grid">
              {movies.rows.map((m, idx) => (
                <div
                  className={
                    "mv-card cb-movie-card" +
                    (String(movieId) === String(m.movie_id) ? " selected" : "")
                  }
                  key={m.movie_id}
                  onClick={() => selectMovie(m.movie_id)}
                >
                  <div className={"mv-poster " + (idx % 2 === 0 ? "p1" : "p2")}>🎬</div>
                  <div className="mv-card-body">
                    <div className="mv-card-tag">
                      {m.genre || "Chưa phân loại"} · {m.duration ?? "?"} phút
                    </div>
                    <div className="mv-card-title">{m.title}</div>
                    <div className="mv-card-meta">📅 Khởi chiếu: {formatDate(m.release_date)}</div>
                  </div>
                </div>
              ))}
              {movies.rows.length === 0 && (
                <div className="et-status">Hiện chưa có phim nào đang chiếu.</div>
              )}
            </div>

            {movieId && (
              <>
                <div className="section-title">2. Chọn suất chiếu</div>
                {showtimesForMovie.length === 0 ? (
                  <div className="et-status">Phim này chưa có suất chiếu nào.</div>
                ) : (
                  <div className="cb-showtime-list">
                    {showtimesForMovie.map((s) => {
                      const room = rooms.rows.find((r) => String(r.room_id) === String(s.room_id));
                      return (
                        <button
                          type="button"
                          key={s.showtime_id}
                          className={
                            "ui-btn ui-btn-sm " +
                            (String(showtimeId) === String(s.showtime_id)
                              ? "ui-btn-primary"
                              : "ui-btn-ghost")
                          }
                          onClick={() => selectShowtime(s.showtime_id)}
                        >
                          {formatDate(s.show_date)} · {s.start_time?.slice(0, 5)} ·{" "}
                          {room?.room_name || `Phòng #${s.room_id}`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {showtimeId && (
              <>
                <div className="section-title">3. Chọn ghế</div>
                <div className="seat-legend">
                  <span><span className="dot avail" /> Còn trống</span>
                  <span><span className="dot taken" /> Đã bán</span>
                  <span><span className="dot selected" /> Đang chọn</span>
                </div>
                <div className="seat-legend">
                  <span>{SEAT_TYPE_LABELS.standard} — {priceForSeatType("standard").toLocaleString("vi-VN")} đ (hàng A-C)</span>
                  <span>{SEAT_TYPE_LABELS.vip} — {priceForSeatType("vip").toLocaleString("vi-VN")} đ (hàng D-G)</span>
                  <span>{SEAT_TYPE_LABELS.couple} — {priceForSeatType("couple").toLocaleString("vi-VN")} đ (hàng H)</span>
                </div>

                {roomSeats.length === 0 ? (
                  <div className="et-status">Phòng chiếu này chưa được khai báo ghế.</div>
                ) : (
                  <div className="seat-map">
                    {roomSeats.map((seat) => {
                      const taken = takenSeatIds.has(String(seat.seat_id));
                      const selected = selectedSeats.includes(String(seat.seat_id));
                      return (
                        <button
                          type="button"
                          key={seat.seat_id}
                          className={
                            "seat-btn" +
                            (taken ? " taken" : "") +
                            (selected ? " selected" : "") +
                            (seat.seat_type === "vip" ? " vip" : "") +
                            (seat.seat_type === "couple" ? " couple" : "")
                          }
                          disabled={taken}
                          onClick={() => toggleSeat(seat)}
                          title={`${SEAT_TYPE_LABELS[seat.seat_type] || seat.seat_type} — ${priceForSeatType(seat.seat_type).toLocaleString("vi-VN")} đ`}
                        >
                          {seat.seat_number}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="section-title">4. Thanh toán</div>
                <div className="ui-field" style={{ maxWidth: 260, marginBottom: 18 }}>
                  <label>Phương thức thanh toán online</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="momo">Ví MoMo</option>
                    <option value="card">Thẻ ngân hàng</option>
                    <option value="banking">Chuyển khoản</option>
                  </select>
                </div>

                <div className="et-table-wrap" style={{ padding: 16, marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span>Số ghế đã chọn: <b>{selectedSeats.length}</b></span>
                    <span>Tổng tiền: <b>{total.toLocaleString("vi-VN")} đ</b></span>
                  </div>
                </div>

                <button
                  className="ui-btn ui-btn-primary"
                  disabled={submitting || selectedSeats.length === 0}
                  onClick={handleSubmit}
                >
                  {submitting ? "Đang xử lý thanh toán..." : `Thanh toán ${total.toLocaleString("vi-VN")} đ`}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
