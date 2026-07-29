// src/pages/TicketCheckInPage.jsx
// Nhân viên/Admin (kể cả Bảo vệ ở cửa soát vé) dùng 1 Ô TÌM KIẾM DUY NHẤT:
// gõ vào là bảng "Đơn đã thanh toán, chờ nhận vé" bên dưới tự lọc theo
// thời gian thực (mã đơn, mã vé, tên/SĐT khách); nếu gõ đúng mã vé và bấm
// Enter thì tra cứu chi tiết luôn (giống bấm nút "Tra cứu" trên 1 dòng).
// Tra cứu xong -> xác nhận đã đưa vé thật. Chặn xác nhận 2 lần cho cùng 1 mã.
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useApiList from "../api/useApiList";
import { lookupTicketsByCode, checkInByCode } from "../api/tickets";
import { useToast } from "../components/ToastContext";
import "./table.css";
import "../components/ui.css";

// Mẫu mã vé hệ thống sinh ra, vd. "VE-8K3F2Q" (xem
// TicketsService.generateUniqueCode ở backend) — dùng để nhận biết khi nào
// người dùng gõ đủ 1 mã vé thật (cho phép Enter để tra cứu chi tiết ngay)
// thay vì chỉ đang gõ dở từ khoá lọc.
const TICKET_CODE_RE = /^VE-[A-Z0-9]+$/i;

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
  const allTickets = useApiList("tickets");
  const payments = useApiList("payments");

  // 1 ô search DUY NHẤT: vừa là từ khoá lọc bảng, vừa là ô nhập mã vé.
  const [kw, setKw] = useState("");
  const [tickets, setTickets] = useState(null); // null = chưa tra cứu chi tiết lần nào
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [hidePickedUp, setHidePickedUp] = useState(true);

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

  // Bảng "Đơn đã thanh toán, chờ nhận vé" — mỗi đơn có payment 'paid' được
  // gộp lại 1 dòng (kèm mã vé chung, số vé đã/chưa nhận), để nhân viên
  // duyệt/click thay vì phải gõ đúng mã vé mới tra cứu được.
  const paidBookingRows = useMemo(() => {
    const rows = payments.rows
      .filter((p) => p.payment_status === "paid")
      .map((p) => {
        const booking = bookingById[String(p.booking_id)];
        if (!booking) return null;
        const bookingTickets = allTickets.rows.filter(
          (t) => String(t.booking_id) === String(p.booking_id),
        );
        const customer = customerById[String(booking.customer_id)];
        const pickedCount = bookingTickets.filter((t) => t.is_picked_up).length;
        const totalCount = bookingTickets.length;
        const showtime = bookingTickets[0] ? showtimeById[String(bookingTickets[0].showtime_id)] : null;
        const movie = showtime ? movieById[String(showtime.movie_id)] : null;
        return {
          booking,
          payment: p,
          customer,
          ticketCode: bookingTickets[0]?.ticket_code || null,
          pickedCount,
          totalCount,
          movieTitle: movie?.title,
          showtimeLabel: showtime ? `${showtime.show_date} · ${showtime.start_time?.slice(0, 5)}` : null,
        };
      })
      .filter(Boolean)
      // Mới thanh toán hiện lên đầu, khỏi phải kéo xuống cuối bảng tìm.
      .sort((a, b) => Number(b.booking.booking_id) - Number(a.booking.booking_id));

    // Gõ SỐ (mã đơn hoặc SĐT) -> so khớp theo TIỀN TỐ (startsWith), không
    // dùng "includes" — tránh việc gõ 1 chữ số lẻ như "6" khớp bừa vào giữa
    // dãy SĐT của người khác (SĐT nào chẳng có sẵn vài chữ số 6, 7, 8...).
    // Gõ CHỮ (tên khách, mã vé, tên phim) vẫn dùng "includes" như bình
    // thường vì các trường này không phải chuỗi số nên ít bị khớp bừa.
    const raw = kw.trim();
    const q = raw.toLowerCase();
    const isNumericQuery = /^\d+$/.test(raw);

    return rows.filter((r) => {
      if (hidePickedUp && r.totalCount > 0 && r.pickedCount >= r.totalCount) return false;
      if (!raw) return true;

      if (isNumericQuery) {
        return (
          String(r.booking.booking_id).startsWith(raw) ||
          (r.customer?.phone || "").startsWith(raw)
        );
      }

      return (
        (r.customer?.full_name || "").toLowerCase().includes(q) ||
        (r.ticketCode || "").toLowerCase().includes(q) ||
        (r.movieTitle || "").toLowerCase().includes(q)
      );
    });
  }, [payments.rows, bookingById, allTickets.rows, customerById, showtimeById, movieById, kw, hidePickedUp]);

  async function loadByTicketCode(ticketCode) {
    if (!ticketCode) return;
    setSearching(true);
    setNotFound(false);
    try {
      const result = await lookupTicketsByCode(ticketCode);
      setTickets(result);
    } catch (err) {
      setTickets(null);
      setNotFound(true);
      toast.error(err.message || "Không tìm thấy vé với mã này.");
    } finally {
      setSearching(false);
    }
  }

  // Vào trang qua ô search ở Topbar (vd. /tickets/checkin?code=VE-8K3F2Q)
  // -> tự điền vào ô search và tra cứu chi tiết ngay.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setKw(codeParam);
      loadByTicketCode(codeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const booking = tickets?.length ? bookingById[String(tickets[0].booking_id)] : null;
  const customer = booking ? customerById[String(booking.customer_id)] : null;
  const allPickedUp = !!tickets?.length && tickets.every((t) => t.is_picked_up);
  // Không cộng dồn ticket_price thôi vì đơn có thể kèm đồ ăn/nước uống
  // (food_orders). booking.total_amount là số tiền THỰC TRẢ backend đã
  // tính sẵn = tổng tiền vé + tổng tiền đồ ăn - giảm giá voucher (xem
  // checkout.service.ts), nên dùng đúng số đó để khớp với thực tế khách
  // đã trả, thay vì chỉ cộng lại giá vé.
  const ticketOnlyTotal = (tickets || []).reduce(
    (sum, t) => sum + Number(t.ticket_price || 0),
    0,
  );
  const totalAmount = booking?.total_amount != null ? Number(booking.total_amount) : ticketOnlyTotal;
  const hasExtraCharges = booking?.total_amount != null && Number(booking.total_amount) > ticketOnlyTotal;

  // Đơn chỉ được coi là "đã thanh toán" khi có ít nhất 1 bản ghi payments
  // với payment_status = 'paid' cho đúng booking_id này — khớp với điều
  // kiện backend đang chặn ở tickets.service.ts#checkIn().
  const bookingPayment = booking
    ? payments.rows.find((p) => String(p.booking_id) === String(booking.booking_id))
    : null;
  const isPaid = booking
    ? payments.rows.some(
        (p) => String(p.booking_id) === String(booking.booking_id) && p.payment_status === "paid",
      )
    : false;

  // Gõ vào ô search luôn lọc bảng theo thời gian thực (qua state `kw` ở
  // trên). Chỉ khi bấm Enter/nút VÀ nội dung gõ đúng định dạng 1 mã vé thật
  // thì mới tra cứu chi tiết — tránh tra cứu nhầm khi người dùng chỉ đang
  // gõ dở tên khách hàng hoặc mã đơn để lọc bảng.
  function handleSubmit(e) {
    e?.preventDefault();
    const trimmed = kw.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Vui lòng nhập mã vé, mã đơn hoặc tên khách để tìm.");
      return;
    }
    if (!TICKET_CODE_RE.test(trimmed)) {
      toast.error(
        "Đây chưa phải mã vé đầy đủ (vd. VE-8K3F2Q) — bảng bên dưới đã lọc theo từ khoá này, " +
          'bấm "Tra cứu" trên đúng dòng cần nhận vé.',
      );
      return;
    }
    loadByTicketCode(trimmed);
  }

  async function handleConfirm() {
    const ticketCode = tickets?.[0]?.ticket_code;
    if (!ticketCode) return;
    setConfirming(true);
    try {
      const result = await checkInByCode(ticketCode);
      setTickets(result);
      // Bảng "Đơn đã thanh toán, chờ nhận vé" ở trên được tính từ
      // allTickets.rows (đã fetch từ trước khi vào trang), nên nếu không
      // nạp lại thì nó vẫn hiển thị is_picked_up cũ -> phải load trang khác
      // rồi quay lại mới thấy đổi. Nạp lại ngay sau khi xác nhận để cột
      // "Trạng thái nhận vé" ở bảng trên cập nhật tức thì.
      allTickets.reload();
      toast.success(`Đã xác nhận đưa vé cho mã "${ticketCode}" (${result.length} ghế).`);
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
            Tìm đơn theo mã đơn/mã vé/tên khách, hoặc nhập đủ mã vé rồi Enter để tra cứu và xác nhận đã đưa vé thật
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, maxWidth: 480, marginBottom: 10 }}>
        <div className="ui-field" style={{ flex: 1, marginBottom: 0 }}>
          <input
            placeholder="🔍 Mã đơn, mã vé (VE-8K3F2Q), tên phim, tên hoặc SĐT khách..."
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </div>
        <button className="ui-btn ui-btn-primary" type="submit" disabled={searching}>
          {searching ? "Đang tra..." : "Tra cứu"}
        </button>
      </form>

      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={hidePickedUp}
          onChange={(e) => setHidePickedUp(e.target.checked)}
        />
        Chỉ hiện đơn chưa nhận vé
      </label>

      {notFound && (
        <div className="et-status">Không tìm thấy vé nào với mã vé này. Kiểm tra lại mã (không phân biệt hoa/thường).</div>
      )}

      <div className="section-title">Đơn đã thanh toán, chờ nhận vé</div>
      <div className="et-table-wrap" style={{ marginBottom: 20 }}>
        <table className="et-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Mã vé</th>
              <th>Khách hàng</th>
              <th>Phim / Suất chiếu</th>
              <th>Số vé</th>
              <th>Trạng thái nhận vé</th>
              <th style={{ width: 1 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paidBookingRows.length === 0 && (
              <tr>
                <td colSpan={7} className="et-status">
                  {kw
                    ? "Không tìm thấy đơn nào khớp."
                    : hidePickedUp
                      ? "Không còn đơn nào chờ nhận vé."
                      : "Chưa có đơn nào đã thanh toán."}
                </td>
              </tr>
            )}
            {paidBookingRows.map((r) => {
              const fullyPicked = r.totalCount > 0 && r.pickedCount >= r.totalCount;
              return (
                <tr key={r.booking.booking_id}>
                  <td>#{r.booking.booking_id}</td>
                  <td>{r.ticketCode || "—"}</td>
                  <td>
                    {r.customer?.full_name || "—"}
                    {r.customer?.phone ? ` · ${r.customer.phone}` : ""}
                  </td>
                  <td>
                    {r.movieTitle || "—"}
                    {r.showtimeLabel ? (
                      <div className="page-sub" style={{ margin: 0 }}>{r.showtimeLabel}</div>
                    ) : null}
                  </td>
                  <td>{r.totalCount}</td>
                  <td>
                    {fullyPicked ? (
                      <span className="et-badge ok">Đã nhận đủ</span>
                    ) : r.pickedCount > 0 ? (
                      <span className="et-badge pending">
                        Đã nhận {r.pickedCount}/{r.totalCount}
                      </span>
                    ) : (
                      <span className="et-badge pending">Chưa nhận</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ui-btn ui-btn-ghost ui-btn-sm"
                      disabled={!r.ticketCode || searching}
                      onClick={() => {
                        setKw(r.ticketCode);
                        loadByTicketCode(r.ticketCode);
                      }}
                    >
                      Tra cứu
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {tickets && tickets.length > 0 && (
        <div className="et-table-wrap" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div><b>Đơn đặt vé:</b> #{tickets[0].booking_id}</div>
              <div><b>Khách hàng:</b> {customer?.full_name || "—"} · {customer?.phone || "—"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div>
                <b>Tổng tiền:</b> {totalAmount.toLocaleString("vi-VN")} đ
                {hasExtraCharges ? (
                  <span className="page-sub" style={{ margin: "2px 0 0" }}>
                    (đã gồm vé {ticketOnlyTotal.toLocaleString("vi-VN")} đ + đồ ăn/nước uống)
                  </span>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 4 }}>
                {isPaid ? (
                  <span className="et-badge ok">Đã thanh toán</span>
                ) : (
                  <span className="et-badge pending">
                    {bookingPayment
                      ? `Thanh toán: ${bookingPayment.payment_status}`
                      : "Chưa có thanh toán"}
                  </span>
                )}
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

          {!isPaid && !allPickedUp && (
            <div className="et-status et-error" style={{ marginBottom: 12 }}>
              Đơn đặt vé này chưa thanh toán thành công nên <b>không thể xác nhận đưa vé</b>.
              Yêu cầu khách thanh toán trước (hoặc kiểm tra lại ở trang Thanh toán) rồi tra cứu lại mã vé.
            </div>
          )}

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
              disabled={confirming || allPickedUp || !isPaid}
              onClick={handleConfirm}
              title={!isPaid && !allPickedUp ? "Đơn chưa thanh toán — không thể xác nhận" : undefined}
            >
              {allPickedUp
                ? "Đã xác nhận đưa vé"
                : !isPaid
                  ? "Chưa thanh toán — không thể xác nhận"
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