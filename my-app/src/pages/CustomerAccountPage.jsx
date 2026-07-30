// src/pages/CustomerAccountPage.jsx
// Trang tài khoản dành cho khách hàng sau khi đăng nhập (không dùng chung
// dashboard Sidebar/Topbar của Admin/Nhân viên — khách hàng không có quyền
// truy cập các trang quản trị). Giao diện thiết kế lại theo phong cách
// CGV / Lotte Cinema: thẻ thành viên bên trái, danh sách vé dạng "vé xé".
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getAuth, updateAuthPoints } from "../api/auth";
import useApiList from "../api/useApiList";
import { resolveAssetUrl } from "../api/apiClient";
import { redeemVoucher } from "../api/vouchers";
import { useToast } from "../components/ToastContext";
import Modal from "../components/Modal";
import CustomerLayout from "../layout/CustomerLayout";
import "./customerAccount.css";

const MIN_REDEEM_POINTS = 100;
const REDEEM_POINTS_STEP = 50;
const VOUCHER_VALUE_PER_POINT = 500;

function formatVND(n) {
  return Number(n || 0).toLocaleString("vi-VN") + " đ";
}

const VOUCHER_STATUS_LABEL = {
  unused: "Chưa dùng",
  used: "Đã dùng",
  expired: "Hết hạn",
};

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
  const toast = useToast();
  const [auth, setAuth] = React.useState(() => getAuth());
  const [showRedeemModal, setShowRedeemModal] = React.useState(false);
  const [redeemPoints, setRedeemPoints] = React.useState(String(MIN_REDEEM_POINTS));
  const [redeemError, setRedeemError] = React.useState("");
  const [redeeming, setRedeeming] = React.useState(false);

  // GET /bookings đã tự lọc theo customer đang đăng nhập ở phía backend.
  const bookings = useApiList("bookings");
  // GET /tickets trả về toàn bộ vé (không lọc theo khách) -> lọc lại ở đây
  // theo các booking thuộc về khách này.
  const tickets = useApiList("tickets");
  const movies = useApiList("movies");
  const showtimes = useApiList("showtimes");
  const rooms = useApiList("rooms");
  const seats = useApiList("seats");
  // Voucher đã đổi từ điểm tích lũy của chính khách hàng ("Ưu đãi của tôi").
  const vouchers = useApiList("vouchers/mine");

  const redeemPointsNum = Number(redeemPoints) || 0;
  const redeemPreview = redeemPointsNum * VOUCHER_VALUE_PER_POINT;

  function validateRedeem(points) {
    if (!Number.isInteger(points) || points <= 0) return "Vui lòng nhập số điểm hợp lệ.";
    if (points < MIN_REDEEM_POINTS) return `Số điểm đổi tối thiểu là ${MIN_REDEEM_POINTS} điểm.`;
    if (points % REDEEM_POINTS_STEP !== 0) return `Số điểm đổi phải là bội số của ${REDEEM_POINTS_STEP}.`;
    if (points > Number(auth?.points ?? 0)) return "Bạn không đủ điểm để đổi voucher này.";
    return "";
  }

  async function handleRedeem() {
    const points = redeemPointsNum;
    const error = validateRedeem(points);
    if (error) {
      setRedeemError(error);
      return;
    }
    setRedeeming(true);
    setRedeemError("");
    try {
      const voucher = await redeemVoucher(points);
      const newPoints = Number(auth?.points ?? 0) - points;
      updateAuthPoints(newPoints);
      setAuth((cur) => ({ ...cur, points: newPoints }));
      vouchers.reload();
      setShowRedeemModal(false);
      setRedeemPoints(String(MIN_REDEEM_POINTS));
      toast.success(`Đổi điểm thành công! Mã voucher: ${voucher.code} — giảm ${formatVND(voucher.discount_amount)}.`);
    } catch (err) {
      setRedeemError(err.message || "Không thể đổi điểm, vui lòng thử lại.");
    } finally {
      setRedeeming(false);
    }
  }

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
            <button
              type="button"
              className="ac-membercard__redeem-btn"
              onClick={() => {
                setRedeemError("");
                setShowRedeemModal(true);
              }}
            >
              Đổi điểm lấy voucher
            </button>
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

        {/* Voucher đã đổi từ điểm tích lũy */}
        <div className="ac-vouchers">
          <div className="ac-vouchers__head">
            <h3>Ưu đãi của tôi</h3>
          </div>
          {vouchers.loading ? (
            <div className="ac-empty">Đang tải voucher...</div>
          ) : vouchers.rows.length === 0 ? (
            <div className="ac-empty">
              <span className="ac-empty__icon">🎁</span>
              Bạn chưa đổi voucher nào. Dùng điểm tích lũy để đổi ngay!
            </div>
          ) : (
            <div className="ac-voucher-list">
              {vouchers.rows.map((v) => (
                <div className={"ac-voucher " + v.status} key={v.voucher_id}>
                  <div>
                    <div className="ac-voucher__code">{v.code}</div>
                    <div className="ac-voucher__meta">
                      Đổi từ {v.points_used} điểm
                      {v.status === "unused" && v.expires_at
                        ? ` · Hạn dùng ${formatDate(v.expires_at)}`
                        : v.status === "used" && v.used_at
                          ? ` · Đã dùng cho đơn #${v.booking_id ?? "—"}`
                          : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="ac-voucher__discount">-{formatVND(v.discount_amount)}</span>
                    <span className="ac-voucher__tag">{VOUCHER_STATUS_LABEL[v.status] || v.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        title="Đổi điểm tích lũy lấy voucher"
        width={420}
      >
        <div className="ac-redeem-form">
          <div className="ac-redeem-form__hint">
            Bạn đang có <strong>{auth?.points ?? 0}</strong> điểm. Đổi tối thiểu{" "}
            {MIN_REDEEM_POINTS} điểm, mỗi lần đổi phải là bội số của {REDEEM_POINTS_STEP} điểm.
            Cứ 1 điểm đổi được {formatVND(VOUCHER_VALUE_PER_POINT)} giảm giá.
          </div>
          <div className="ac-redeem-form__row">
            <input
              type="number"
              min={MIN_REDEEM_POINTS}
              step={REDEEM_POINTS_STEP}
              value={redeemPoints}
              onChange={(e) => {
                setRedeemPoints(e.target.value);
                setRedeemError("");
              }}
            />
            <span>điểm</span>
          </div>
          <div className="ac-redeem-form__preview">
            Voucher nhận được: <strong>{formatVND(redeemPreview)}</strong> giảm giá, hạn dùng 90
            ngày.
          </div>
          {redeemError && <div className="ac-redeem-form__error">{redeemError}</div>}
          <button
            type="button"
            className="ac-redeem-form__submit"
            disabled={redeeming}
            onClick={handleRedeem}
          >
            {redeeming ? "Đang xử lý..." : "Xác nhận đổi voucher"}
          </button>
        </div>
      </Modal>
    </CustomerLayout>
  );
}