
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApiList from "../api/useApiList";
import { createItem } from "../api/apiClient";
import { useToast } from "../components/ToastContext";
import "./table.css";
import "../components/ui.css";

export default function NewBookingPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const movies = useApiList("movies");
  const rooms = useApiList("rooms");
  const showtimes = useApiList("showtimes");
  const seats = useApiList("seats");
  const tickets = useApiList("tickets");
  const customers = useApiList("customers");

  const [movieId, setMovieId] = useState("");
  const [showtimeId, setShowtimeId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerKw, setCustomerKw] = useState("");
  const [ticketPrice, setTicketPrice] = useState("75000");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [createPayment, setCreatePayment] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);

  const filteredShowtimes = useMemo(
    () => showtimes.rows.filter((s) => !movieId || String(s.movie_id) === String(movieId)),
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

  const filteredCustomers = useMemo(() => {
    if (!customerKw.trim()) return customers.rows.slice(0, 8);
    const kw = customerKw.trim().toLowerCase();
    return customers.rows
      .filter(
        (c) =>
          (c.full_name || "").toLowerCase().includes(kw) ||
          (c.phone || "").includes(kw) ||
          (c.email || "").toLowerCase().includes(kw),
      )
      .slice(0, 8);
  }, [customers.rows, customerKw]);

  const selectedCustomer = customers.rows.find(
    (c) => String(c.customer_id) === String(customerId),
  );

  function toggleSeat(seat) {
    const id = String(seat.seat_id);
    if (takenSeatIds.has(id)) return;
    setSelectedSeats((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }

  function resetForm() {
    setSelectedSeats([]);
  }

  const total = selectedSeats.length * (Number(ticketPrice) || 0);

  async function handleSubmit() {
    if (!showtimeId) return toast.error("Vui lòng chọn suất chiếu.");
    if (!customerId) return toast.error("Vui lòng chọn khách hàng.");
    if (selectedSeats.length === 0) return toast.error("Vui lòng chọn ít nhất 1 ghế.");

    setSubmitting(true);
    try {
      const booking = await createItem("bookings", {
        customer_id: Number(customerId),
        total_amount: total,
        status: "pending",
      });
      const bookingId = booking.booking_id ?? booking.id;

      for (const seatId of selectedSeats) {
        await createItem("tickets", {
          booking_id: bookingId,
          showtime_id: Number(showtimeId),
          seat_id: Number(seatId),
          ticket_price: Number(ticketPrice),
        });
      }

      if (createPayment) {
        await createItem("payments", {
          booking_id: bookingId,
          amount: total,
          payment_method: paymentMethod,
          payment_status: "paid",
        });
      }

      toast.success(`Đã tạo đơn đặt vé #${bookingId} với ${selectedSeats.length} ghế.`);
      resetForm();
      navigate("/bookings");
    } catch (err) {
      toast.error(
        err.message ||
          "Không thể tạo đơn đặt vé — có thể một ghế vừa bị người khác đặt, vui lòng thử lại.",
      );
      tickets.reload();
    } finally {
      setSubmitting(false);
    }
  }

  const busy = movies.loading || rooms.loading || showtimes.loading;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Bán vé mới</div>
          <div className="page-sub">
            Chọn suất chiếu, sơ đồ ghế và khách hàng để tạo đơn đặt vé
          </div>
        </div>
      </div>

      {busy ? (
        <div className="et-status">Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className="ui-form-grid" style={{ marginBottom: 18 }}>
            <div className="ui-field">
              <label>Phim</label>
              <select
                value={movieId}
                onChange={(e) => {
                  setMovieId(e.target.value);
                  setShowtimeId("");
                  setSelectedSeats([]);
                }}
              >
                <option value="">-- Tất cả phim --</option>
                {movies.rows.map((m) => (
                  <option key={m.movie_id} value={m.movie_id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="ui-field">
              <label>Suất chiếu</label>
              <select
                value={showtimeId}
                onChange={(e) => {
                  setShowtimeId(e.target.value);
                  setSelectedSeats([]);
                }}
              >
                <option value="">-- Chọn suất chiếu --</option>
                {filteredShowtimes.map((s) => {
                  const room = rooms.rows.find((r) => String(r.room_id) === String(s.room_id));
                  return (
                    <option key={s.showtime_id} value={s.showtime_id}>
                      {s.show_date} · {s.start_time} · {room?.room_name || `Phòng #${s.room_id}`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="ui-field">
              <label>Giá vé / ghế (đ)</label>
              <input
                type="number"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
              />
            </div>
          </div>

          {showtimeId && (
            <>
              <div className="section-title">Sơ đồ ghế</div>
              <div className="seat-legend">
                <span><span className="dot avail" /> Còn trống</span>
                <span><span className="dot taken" /> Đã bán</span>
                <span><span className="dot selected" /> Đang chọn</span>
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
                          (seat.seat_type === "vip" ? " vip" : "")
                        }
                        disabled={taken}
                        onClick={() => toggleSeat(seat)}
                        title={seat.seat_type}
                      >
                        {seat.seat_number}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="section-title">Khách hàng</div>
              <div className="ui-field" style={{ maxWidth: 380, marginBottom: 10 }}>
                <input
                  placeholder="🔍 Tìm theo tên, SĐT, email..."
                  value={customerKw}
                  onChange={(e) => setCustomerKw(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {filteredCustomers.map((c) => (
                  <button
                    type="button"
                    key={c.customer_id}
                    className={
                      "ui-btn ui-btn-sm " +
                      (String(customerId) === String(c.customer_id) ? "ui-btn-primary" : "ui-btn-ghost")
                    }
                    onClick={() => setCustomerId(c.customer_id)}
                  >
                    {c.full_name} · {c.phone || c.email}
                  </button>
                ))}
                {customers.rows.length === 0 && (
                  <span className="page-sub">Chưa có khách hàng nào trong hệ thống.</span>
                )}
              </div>

              <div className="section-title">Thanh toán</div>
              <div className="ui-field" style={{ maxWidth: 260, marginBottom: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={createPayment}
                    onChange={(e) => setCreatePayment(e.target.checked)}
                  />
                  Xác nhận thanh toán ngay
                </label>
              </div>
              {createPayment && (
                <div className="ui-field" style={{ maxWidth: 220, marginBottom: 18 }}>
                  <label>Phương thức</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="cash">Tiền mặt</option>
                    <option value="card">Thẻ</option>
                    <option value="momo">Momo</option>
                  </select>
                </div>
              )}

              <div className="et-table-wrap" style={{ padding: 16, marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>Số ghế đã chọn: <b>{selectedSeats.length}</b></span>
                  <span>Khách hàng: <b>{selectedCustomer?.full_name || "Chưa chọn"}</b></span>
                  <span>Tổng tiền: <b>{total.toLocaleString("vi-VN")} đ</b></span>
                </div>
              </div>

              <button
                className="ui-btn ui-btn-primary"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Đang tạo đơn..." : "Tạo đơn đặt vé"}
              </button>
            </>
          )}
        </>
      )}
    </>
  );
}
