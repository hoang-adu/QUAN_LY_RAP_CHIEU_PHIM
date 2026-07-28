// src/pages/CustomerBookingPage.jsx
// Khách hàng tự đặt vé online: chọn phim -> chọn suất chiếu -> chọn ghế
// -> thanh toán online. Dùng lại đúng logic tạo booking/ticket/payment
// như NewBookingPage.jsx (bên phía nhân viên), chỉ khác customer_id lấy
// thẳng từ tài khoản đang đăng nhập, không cần chọn khách hàng.
// Giao diện được thiết kế lại theo phong cách CGV / Lotte Cinema.
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApiList from "../api/useApiList";
import { createItem } from "../api/apiClient";
import useSeatLocks from "../api/useSeatLocks";
import { getCustomerId } from "../api/auth";
import { priceForSeatType, SEAT_TYPE_LABELS } from "../utils/seatPricing";
import { useToast } from "../components/ToastContext";
import CustomerLayout from "../layout/CustomerLayout";
import "./customerBooking.css";

const POSTER_THEMES = ["t1", "t2", "t3", "t4", "t5", "t6"];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

function formatDayLabel(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const weekday = d.toLocaleDateString("vi-VN", { weekday: "short" });
  return `${weekday} ${d.getDate()}/${d.getMonth() + 1}`;
}

const STEPS = [
  { key: "movie", label: "Chọn phim" },
  { key: "showtime", label: "Suất chiếu" },
  { key: "seat", label: "Chọn ghế" },
  { key: "pay", label: "Thanh toán" },
];

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

  // Nhóm suất chiếu theo ngày để hiển thị dạng tab ngày (giống CGV/Lotte).
  const showtimesByDate = useMemo(() => {
    const map = new Map();
    for (const s of showtimesForMovie) {
      const key = s.show_date || "?";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return Array.from(map.entries())
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([date, list]) => ({
        date,
        list: list.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time))),
      }));
  }, [showtimesForMovie]);

  const [activeDate, setActiveDate] = useState(null);
  const effectiveDate = activeDate || showtimesByDate[0]?.date || null;
  const showtimesOfActiveDate =
    showtimesByDate.find((g) => g.date === effectiveDate)?.list || [];

  const currentMovie = useMemo(
    () => movies.rows.find((m) => String(m.movie_id) === String(movieId)),
    [movies.rows, movieId],
  );

  const currentShowtime = useMemo(
    () => showtimes.rows.find((s) => String(s.showtime_id) === String(showtimeId)),
    [showtimes.rows, showtimeId],
  );

  const currentRoom = useMemo(
    () => rooms.rows.find((r) => String(r.room_id) === String(currentShowtime?.room_id)),
    [rooms.rows, currentShowtime],
  );

  const roomSeats = useMemo(() => {
    if (!currentShowtime) return [];
    return seats.rows
      .filter((s) => String(s.room_id) === String(currentShowtime.room_id))
      .sort((a, b) => String(a.seat_number).localeCompare(String(b.seat_number)));
  }, [seats.rows, currentShowtime]);

  // Gom ghế theo hàng (chữ cái đầu của seat_number) để vẽ sơ đồ rạp thật.
  const seatRows = useMemo(() => {
    const map = new Map();
    for (const s of roomSeats) {
      const row = String(s.seat_number || "").charAt(0) || "?";
      if (!map.has(row)) map.set(row, []);
      map.get(row).push(s);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([row, list]) => ({
        row,
        list: list.sort(
          (a, b) =>
            parseInt(String(a.seat_number).slice(1), 10) -
            parseInt(String(b.seat_number).slice(1), 10),
        ),
      }));
  }, [roomSeats]);

  const takenSeatIds = useMemo(() => {
    if (!showtimeId) return new Set();
    return new Set(
      tickets.rows
        .filter((t) => String(t.showtime_id) === String(showtimeId))
        .map((t) => String(t.seat_id)),
    );
  }, [tickets.rows, showtimeId]);

  const stepIndex = !movieId ? 0 : !showtimeId ? 1 : selectedSeats.length === 0 ? 2 : 3;

  function selectMovie(id) {
    setMovieId(id);
    setShowtimeId("");
    setSelectedSeats([]);
    setActiveDate(null);
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
      // Gọi 1 API duy nhất — backend tạo đơn + vé cho từng ghế + thu tiền
      // ngay trong 1 luồng, tự dọn sạch nếu có ghế bị người khác mua giữa
      // chừng (không để lại đơn dở dang).
      const result = await createItem("bookings/checkout", {
        showtime_id: Number(showtimeId),
        seats: selectedSeats.map((seatId) => ({
          seat_id: Number(seatId),
          ticket_price: priceForSeatType(seatById[seatId]?.seat_type),
        })),
        pay: true,
        payment_method: paymentMethod,
      });
      const bookingId = result.booking?.booking_id;

      toast.success(`Đặt vé thành công! Đơn #${bookingId} với ${selectedSeats.length} ghế.`);
      // Không chuyển trang ngay — hiện mã vé để khách chụp lại/ghi nhớ,
      // vì mã này cần đưa tại quầy để nhận vé thật.
      setSuccessInfo({
        bookingId,
        code: result.tickets?.[0]?.ticket_code || null,
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
        <div className="cb-wrap">
          <div className="cb-success">
            <div className="cb-success__badge">🎉</div>
            <h2>Đặt vé thành công!</h2>
            <p>Lưu lại mã vé bên dưới — đưa mã này tại quầy để nhận vé thật</p>

            <div className="cb-ticket-stub">
              <div className="cb-ticket-stub__code-label">MÃ VÉ CỦA BẠN</div>
              <div className="cb-ticket-stub__code">{successInfo.code || "—"}</div>
              <div className="cb-ticket-stub__divider">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} />
                ))}
              </div>
              <div className="cb-ticket-stub__row">
                <span>Đơn hàng</span>
                <strong>#{successInfo.bookingId}</strong>
              </div>
              <div className="cb-ticket-stub__row">
                <span>Ghế</span>
                <strong>{successInfo.seatNumbers.join(", ") || "—"}</strong>
              </div>
              <div className="cb-ticket-stub__row">
                <span>Tổng tiền</span>
                <strong>{successInfo.total.toLocaleString("vi-VN")} đ</strong>
              </div>
            </div>

            <p className="cb-success__note">
              Vui lòng đưa mã vé này cho nhân viên tại quầy trước giờ chiếu để nhận vé.
              Vé đặt online đã thanh toán sẽ <b>không được hoàn tiền</b> nếu không đi xem được.
            </p>

            <button className="cb-btn cb-btn-primary" onClick={() => navigate("/account", { replace: true })}>
              Về trang tài khoản
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="cb-wrap">
        {/* Thanh tiến trình đặt vé */}
        <div className="cb-steps">
          {STEPS.map((s, idx) => (
            <div className={"cb-step" + (idx <= stepIndex ? " done" : "")} key={s.key}>
              <span className="cb-step__dot">{idx < stepIndex ? "✓" : idx + 1}</span>
              <span className="cb-step__label">{s.label}</span>
              {idx < STEPS.length - 1 && <span className="cb-step__line" />}
            </div>
          ))}
        </div>

        {busy ? (
          <div className="cb-status">Đang tải danh sách phim...</div>
        ) : (
          <div className="cb-layout">
            <div className="cb-main">
              {/* Bước 1: chọn phim */}
              <section className="cb-section">
                <h3 className="cb-section__title">
                  <span className="cb-section__num">1</span> Chọn phim
                </h3>
                <div className="cb-movie-grid">
                  {movies.rows.map((m, idx) => (
                    <div
                      className={
                        "cb-movie-card" + (String(movieId) === String(m.movie_id) ? " selected" : "")
                      }
                      key={m.movie_id}
                      onClick={() => selectMovie(m.movie_id)}
                    >
                      <div className={"cb-movie-poster " + POSTER_THEMES[idx % POSTER_THEMES.length]}>
                        <span className="cb-movie-poster__icon">🎬</span>
                        {String(movieId) === String(m.movie_id) && (
                          <span className="cb-movie-poster__check">✓</span>
                        )}
                      </div>
                      <div className="cb-movie-info">
                        <div className="cb-movie-tag">{m.genre || "Chưa phân loại"}</div>
                        <div className="cb-movie-title">{m.title}</div>
                        <div className="cb-movie-meta">
                          ⏱ {m.duration ?? "?"} phút · 📅 {formatDate(m.release_date)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {movies.rows.length === 0 && (
                    <div className="cb-status">Hiện chưa có phim nào đang chiếu.</div>
                  )}
                </div>
              </section>

              {/* Bước 2: chọn suất chiếu */}
              {movieId && (
                <section className="cb-section">
                  <h3 className="cb-section__title">
                    <span className="cb-section__num">2</span> Chọn suất chiếu
                  </h3>
                  {showtimesForMovie.length === 0 ? (
                    <div className="cb-status">Phim này chưa có suất chiếu nào.</div>
                  ) : (
                    <>
                      <div className="cb-date-tabs">
                        {showtimesByDate.map((g) => (
                          <button
                            type="button"
                            key={g.date}
                            className={"cb-date-tab" + (effectiveDate === g.date ? " active" : "")}
                            onClick={() => setActiveDate(g.date)}
                          >
                            {formatDayLabel(g.date)}
                          </button>
                        ))}
                      </div>
                      <div className="cb-showtime-list">
                        {showtimesOfActiveDate.map((s) => {
                          const room = rooms.rows.find((r) => String(r.room_id) === String(s.room_id));
                          return (
                            <button
                              type="button"
                              key={s.showtime_id}
                              className={
                                "cb-time-chip" +
                                (String(showtimeId) === String(s.showtime_id) ? " active" : "")
                              }
                              onClick={() => selectShowtime(s.showtime_id)}
                            >
                              <span className="cb-time-chip__time">{s.start_time?.slice(0, 5)}</span>
                              <span className="cb-time-chip__room">{room?.room_name || `Phòng #${s.room_id}`}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </section>
              )}

              {/* Bước 3: chọn ghế */}
              {showtimeId && (
                <section className="cb-section">
                  <h3 className="cb-section__title">
                    <span className="cb-section__num">3</span> Chọn ghế
                  </h3>

                  <p className="cb-hint">
                    Ghế bạn chọn sẽ được giữ trong 5 phút để hoàn tất thanh toán. Quá thời gian, ghế sẽ tự trống lại.
                  </p>

                  {roomSeats.length === 0 ? (
                    <div className="cb-status">Phòng chiếu này chưa được khai báo ghế.</div>
                  ) : (
                    <div className="cb-screen-area">
                      <div className="cb-screen">
                        <div className="cb-screen__curve" />
                        <span>MÀN HÌNH</span>
                      </div>

                      <div className="cb-seat-map">
                        {seatRows.map(({ row, list }) => (
                          <div className="cb-seat-row" key={row}>
                            <span className="cb-seat-row__label">{row}</span>
                            <div className="cb-seat-row__seats">
                              {list.map((seat) => {
                                const seatId = String(seat.seat_id);
                                const taken = takenSeatIds.has(seatId);
                                const held = lockedByOthers.has(seatId);
                                const selected = selectedSeats.includes(seatId);
                                return (
                                  <button
                                    type="button"
                                    key={seat.seat_id}
                                    className={
                                      "cb-seat" +
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
                                    {String(seat.seat_number).slice(1)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="cb-legend">
                        <span><i className="cb-dot avail" /> Còn trống</span>
                        <span><i className="cb-dot selected" /> Đang chọn</span>
                        <span><i className="cb-dot held" /> Đang giữ</span>
                        <span><i className="cb-dot taken" /> Đã bán</span>
                        <span><i className="cb-dot vip" /> {SEAT_TYPE_LABELS.vip} · {priceForSeatType("vip").toLocaleString("vi-VN")}đ</span>
                        <span><i className="cb-dot couple" /> {SEAT_TYPE_LABELS.couple} · {priceForSeatType("couple").toLocaleString("vi-VN")}đ</span>
                        <span><i className="cb-dot standard" /> {SEAT_TYPE_LABELS.standard} · {priceForSeatType("standard").toLocaleString("vi-VN")}đ</span>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Cột phải: tóm tắt đơn + thanh toán, dính theo khi cuộn */}
            {movieId && (
              <aside className="cb-summary">
                <div className="cb-summary__card">
                  <h4>Thông tin vé</h4>
                  <div className="cb-summary__movie">{currentMovie?.title || "—"}</div>

                  {currentShowtime && (
                    <div className="cb-summary__row">
                      <span>Suất chiếu</span>
                      <strong>
                        {formatDate(currentShowtime.show_date)} · {currentShowtime.start_time?.slice(0, 5)}
                      </strong>
                    </div>
                  )}
                  {currentRoom && (
                    <div className="cb-summary__row">
                      <span>Phòng</span>
                      <strong>{currentRoom.room_name}</strong>
                    </div>
                  )}
                  <div className="cb-summary__row">
                    <span>Số ghế</span>
                    <strong>{selectedSeats.length}</strong>
                  </div>
                  {selectedSeats.length > 0 && (
                    <div className="cb-summary__row">
                      <span>Ghế đã chọn</span>
                      <strong>
                        {selectedSeats.map((id) => seatById[id]?.seat_number).join(", ")}
                      </strong>
                    </div>
                  )}

                  <div className="cb-summary__total">
                    <span>Tổng tiền</span>
                    <strong>{total.toLocaleString("vi-VN")} đ</strong>
                  </div>

                  {showtimeId && (
                    <>
                      <div className="cb-field">
                        <label>Phương thức thanh toán</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          <option value="momo">Ví MoMo</option>
                          <option value="card">Thẻ ngân hàng</option>
                          <option value="banking">Chuyển khoản</option>
                        </select>
                      </div>

                      <button
                        className="cb-btn cb-btn-primary cb-btn-block"
                        disabled={submitting || selectedSeats.length === 0}
                        onClick={handleSubmit}
                      >
                        {submitting ? "Đang xử lý thanh toán..." : `Thanh toán ${total.toLocaleString("vi-VN")} đ`}
                      </button>
                    </>
                  )}
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}