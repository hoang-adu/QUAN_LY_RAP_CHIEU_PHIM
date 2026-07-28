// src/pages/CustomerBookingPage.jsx
// Khách hàng tự đặt vé online: chọn phim -> chọn suất chiếu -> chọn ghế
// -> thanh toán online. Dùng lại đúng logic tạo booking/ticket/payment
// như NewBookingPage.jsx (bên phía nhân viên), chỉ khác customer_id lấy
// thẳng từ tài khoản đang đăng nhập, không cần chọn khách hàng.
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApiList from "../api/useApiList";
import { createItem } from "../api/apiClient";
import useSeatLocks from "../api/useSeatLocks";
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
  const [successInfo, setSuccessInfo] = useState(null);

  // Ghế đang được NGƯỜI KHÁC giữ tạm (seat-lock) cho suất chiếu đang chọn.
  const { lockedByOthers, hold, release } = useSeatLocks(showtimeId || null);

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

  async function toggleSeat(seat) {
    const id = String(seat.seat_id);
    if (takenSeatIds.has(id) || lockedByOthers.has(id)) return;

    if (selectedSeats.includes(id)) {
      setSelectedSeats((cur) => cur.filter((x) => x !== id));
      release(id);
      return;
    }

    try {
      await hold(id);
      setSelectedSeats((cur) => [...cur, id]);
    } catch (err) {
      toast.error(err.message || `Ghế ${seat.seat_number} vừa được người khác giữ.`);
    }
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

      const createdTickets = [];
      for (const seatId of selectedSeats) {
        const seat = seatById[seatId];
        const ticket = await createItem("tickets", {
          booking_id: bookingId,
          showtime_id: Number(showtimeId),
          seat_id: Number(seatId),
          ticket_price: priceForSeatType(seat?.seat_type),
        });
        createdTickets.push(ticket);
      }

      await createItem("payments", {
        booking_id: bookingId,
        amount: total,
        payment_method: paymentMethod,
        payment_status: "paid",
      });

      toast.success(`Đặt vé thành công! Đơn #${bookingId} với ${selectedSeats.length} ghế.`);
      // Không chuyển trang ngay — hiện mã vé để khách chụp lại/ghi nhớ,
      // vì mã này cần đưa tại quầy để nhận vé thật.
      setSuccessInfo({
        bookingId,
        code: createdTickets[0]?.ticket_code || null,
        seatNumbers: selectedSeats.map((id) => seatById[id]?.seat_number).filter(Boolean),
        total,
      });
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

  if (successInfo) {
    return (
      <CustomerLayout>
        <div className="cb-page">
          <div className="page-head">
            <div>
              <div className="page-title">Đặt vé thành công! 🎉</div>
              <div className="page-sub">Lưu lại mã vé bên dưới — đưa mã này tại quầy để nhận vé</div>
            </div>
          </div>

          <div className="et-table-wrap" style={{ padding: 24, maxWidth: 420, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Mã vé của bạn</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>
              {successInfo.code || "—"}
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>
              Đơn #{successInfo.bookingId} · Ghế: {successInfo.seatNumbers.join(", ") || "—"}
            </div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 18 }}>
              Tổng tiền: {successInfo.total.toLocaleString("vi-VN")} đ
            </div>
            <div style={{ fontSize: 13, marginBottom: 18 }}>
              Vui lòng đưa mã vé này cho nhân viên tại quầy trước giờ chiếu để nhận vé. Vé đặt online đã thanh toán sẽ <b>không được hoàn tiền</b> nếu không đi xem được.
            </div>
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => navigate("/account", { replace: true })}
            >
              Về trang tài khoản
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

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
                  <span><span className="dot held" /> Đang được giữ</span>
                  <span><span className="dot taken" /> Đã bán</span>
                  <span><span className="dot selected" /> Đang chọn</span>
                </div>
                <div className="seat-legend">
                  <span>{SEAT_TYPE_LABELS.standard} — {priceForSeatType("standard").toLocaleString("vi-VN")} đ (hàng A-C)</span>
                  <span>{SEAT_TYPE_LABELS.vip} — {priceForSeatType("vip").toLocaleString("vi-VN")} đ (hàng D-G)</span>
                  <span>{SEAT_TYPE_LABELS.couple} — {priceForSeatType("couple").toLocaleString("vi-VN")} đ (hàng H)</span>
                </div>
                <div className="page-sub" style={{ marginBottom: 10 }}>
                  Ghế bạn chọn sẽ được giữ trong 5 phút để hoàn tất thanh toán. Quá thời gian, ghế sẽ tự trống lại.
                </div>

                {roomSeats.length === 0 ? (
                  <div className="et-status">Phòng chiếu này chưa được khai báo ghế.</div>
                ) : (
                  <div className="seat-map">
                    {roomSeats.map((seat) => {
                      const seatId = String(seat.seat_id);
                      const taken = takenSeatIds.has(seatId);
                      const held = lockedByOthers.has(seatId);
                      const selected = selectedSeats.includes(seatId);
                      return (
                        <button
                          type="button"
                          key={seat.seat_id}
                          className={
                            "seat-btn" +
                            (taken ? " taken" : "") +
                            (!taken && held ? " held" : "") +
                            (selected ? " selected" : "") +
                            (seat.seat_type === "vip" ? " vip" : "") +
                            (seat.seat_type === "couple" ? " couple" : "")
                          }
                          disabled={taken || (held && !selected)}
                          onClick={() => toggleSeat(seat)}
                          title={
                            taken
                              ? "Ghế đã bán"
                              : held
                                ? "Ghế đang được người khác giữ, thử lại sau ít phút"
                                : `${SEAT_TYPE_LABELS[seat.seat_type] || seat.seat_type} — ${priceForSeatType(seat.seat_type).toLocaleString("vi-VN")} đ`
                          }
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