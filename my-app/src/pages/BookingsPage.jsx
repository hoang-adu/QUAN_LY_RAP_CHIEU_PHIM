import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import { updateItem } from "../api/apiClient";
import { useToast } from "../components/ToastContext";
import "./table.css";
import "../components/ui.css";

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const cls = s === "confirmed" ? "ok" : s === "cancelled" ? "cancel" : "pending";
  return <span className={"et-badge " + cls}>{status || "—"}</span>;
}

function paymentStatusBadge(payment) {
  if (!payment) return <span className="et-badge pending">Chưa thanh toán</span>;
  const s = (payment.payment_status || "").toLowerCase();
  const cls = s === "paid" ? "ok" : s === "failed" || s === "refunded" ? "cancel" : "pending";
  const channelLabel = payment.channel === "online" ? "🌐" : payment.channel === "counter" ? "🏢" : "";
  const label = s === "refunded" ? "Đã hoàn (hủy đơn)" : payment.payment_status || "—";
  return (
    <span className={"et-badge " + cls}>
      {channelLabel} {label}
    </span>
  );
}

export default function BookingsPage() {
  const bookings = useApiList("bookings");
  const tickets = useApiList("tickets");
  const customers = useApiList("customers");
  const payments = useApiList("payments");
  const movies = useApiList("movies");
  const showtimes = useApiList("showtimes");
  const rooms = useApiList("rooms");
  const seats = useApiList("seats");
  const toast = useToast();
  const [updatingId, setUpdatingId] = useState(null);
  const [bookingKw, setBookingKw] = useState("");
  const [ticketKw, setTicketKw] = useState("");

  // Vào trang qua ô search ở Topbar (vd. /bookings?q=0912345678) -> tự
  // điền sẵn vào cả 2 ô lọc bên dưới (đơn lẫn vé), khỏi phải gõ lại.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setBookingKw(q);
      setTicketKw(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customerNameById = Object.fromEntries(
    customers.rows.map((c) => [String(c.customer_id), c.full_name]),
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

  // Đơn nào đã thanh toán ONLINE thành công -> không cho hủy trên UI nữa
  // (backend cũng chặn, nhưng disable sẵn ở đây để nhân viên không bấm nhầm
  // rồi mới thấy lỗi). Đơn thanh toán tại quầy vẫn hủy được bình thường.
  const paidOnlineBookingIds = useMemo(
    () =>
      new Set(
        payments.rows
          .filter((p) => p.channel === "online" && p.payment_status === "paid")
          .map((p) => String(p.booking_id)),
      ),
    [payments.rows],
  );

  // Mỗi booking gắn với tối đa 1 payment trong nghiệp vụ hiện tại -> map
  // nhanh để hiển thị trạng thái thanh toán ngay trên bảng đơn, khỏi phải
  // nhảy sang trang Thanh toán mới biết đơn đã thu tiền hay chưa.
  const paymentByBookingId = useMemo(
    () => Object.fromEntries(payments.rows.map((p) => [String(p.booking_id), p])),
    [payments.rows],
  );

  // Số ghế/vé đã bán của từng đơn — hiển thị luôn trên bảng đơn để nhân
  // viên không phải đếm thủ công ở bảng vé bên dưới.
  const ticketCountByBookingId = useMemo(() => {
    const map = {};
    for (const t of tickets.rows) {
      const key = String(t.booking_id);
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [tickets.rows]);

  // booking_id -> customer_id, để từ 1 dòng vé (chỉ có booking_id) suy ra
  // được tên khách hàng hiển thị ngay trên bảng Vé, khỏi phải mở đơn ra xem.
  const customerIdByBookingId = useMemo(
    () => Object.fromEntries(bookings.rows.map((b) => [String(b.booking_id), b.customer_id])),
    [bookings.rows],
  );

  function customerNameForBooking(bookingId) {
    const customerId = customerIdByBookingId[String(bookingId)];
    return customerNameById[String(customerId)] || "—";
  }

  // Tìm đơn theo mã đơn (booking_id) hoặc tên/SĐT khách hàng.
  // Gõ SỐ (mã đơn/SĐT) -> so khớp theo TIỀN TỐ (startsWith), không dùng
  // "includes" — tránh việc gõ 1 chữ số lẻ như "6" khớp bừa vào giữa dãy
  // SĐT của người khác (SĐT nào chẳng có sẵn vài chữ số 6, 7, 8...).
  // Gõ CHỮ (tên khách) vẫn dùng "includes" vì không phải chuỗi số nên ít
  // bị khớp nhầm.
  const filteredBookings = useMemo(() => {
    const raw = bookingKw.trim();
    if (!raw) return bookings.rows;
    const kw = raw.toLowerCase();
    const isNumericQuery = /^\d+$/.test(raw);
    return bookings.rows.filter((b) => {
      const customer = customers.rows.find(
        (c) => String(c.customer_id) === String(b.customer_id),
      );
      if (isNumericQuery) {
        return (
          String(b.booking_id).startsWith(raw) ||
          (customer?.phone || "").startsWith(raw)
        );
      }
      return (customer?.full_name || "").toLowerCase().includes(kw);
    });
  }, [bookings.rows, customers.rows, bookingKw]);

  // Tìm vé theo mã đơn, ID vé, mã vé, tên khách hàng, hoặc tên phim — ví
  // dụ gõ "1" thì ra hết vé thuộc đơn #1, không cần dò tay giữa hàng triệu
  // vé. Cùng quy tắc số/chữ như bảng đơn ở trên.
  const filteredTickets = useMemo(() => {
    const raw = ticketKw.trim();
    if (!raw) return tickets.rows;
    const kw = raw.toLowerCase();
    const isNumericQuery = /^\d+$/.test(raw);
    return tickets.rows.filter((t) => {
      if (isNumericQuery) {
        return (
          String(t.booking_id).startsWith(raw) || String(t.ticket_id).startsWith(raw)
        );
      }
      const showtime = showtimeById[String(t.showtime_id)];
      const movieTitle = showtime ? movieById[String(showtime.movie_id)]?.title || "" : "";
      return (
        (t.ticket_code || "").toLowerCase().includes(kw) ||
        customerNameForBooking(t.booking_id).toLowerCase().includes(kw) ||
        movieTitle.toLowerCase().includes(kw)
      );
    });
  }, [tickets.rows, ticketKw, customerIdByBookingId, customerNameById, showtimeById, movieById]);

  async function changeStatus(row, status) {
    setUpdatingId(row.booking_id);
    try {
      await updateItem("bookings", row.booking_id, { status });
      toast.success(`Đã cập nhật đơn #${row.booking_id} -> ${status}.`);
      bookings.reload();
      tickets.reload();
    } catch (err) {
      toast.error(err.message || "Cập nhật thất bại.");
    } finally {
      setUpdatingId(null);
    }
  }

  function printBooking(row) {

    window.print();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Đặt vé & Vé</div>
          <div className="page-sub">Tổng quan</div>
        </div>
        <Link to="/bookings/new" className="ui-btn ui-btn-primary">
          + Bán vé mới
        </Link>
      </div>

      <div className="section-title">Danh sách đơn đặt vé (Booking)</div>
      <div className="ui-field" style={{ maxWidth: 380, marginBottom: 10 }}>
        <input
          placeholder="🔍 Tìm theo mã đơn, tên hoặc SĐT khách hàng..."
          value={bookingKw}
          onChange={(e) => setBookingKw(e.target.value)}
        />
      </div>
      <DataTable
        rows={filteredBookings}
        loading={bookings.loading}
        error={bookings.error}
        emptyText={bookingKw ? "Không tìm thấy đơn nào khớp." : undefined}
        columns={[
          { key: "booking_id", label: "Mã đơn" },
          {
            key: "customer_id",
            label: "Khách hàng",
            render: (v) => customerNameById[String(v)] || (v ? `#${v}` : "—"),
          },
          { key: "booking_date", label: "Ngày đặt" },
          {
            key: "ticket_count",
            label: "Số vé",
            render: (_v, row) => ticketCountByBookingId[String(row.booking_id)] || 0,
          },
          {
            key: "total_amount",
            label: "Tổng tiền",
            render: (v) => (v != null ? Number(v).toLocaleString("vi-VN") + " đ" : "—"),
          },
          { key: "status", label: "Trạng thái đơn", render: statusBadge },
          {
            key: "payment_status",
            label: "Thanh toán",
            render: (_v, row) => paymentStatusBadge(paymentByBookingId[String(row.booking_id)]),
          },
        ]}
        actions={(row) => (
          <>
            {row.status !== "confirmed" && (
              <button
                className="ui-btn ui-btn-ghost ui-btn-sm"
                disabled={updatingId === row.booking_id}
                onClick={() => changeStatus(row, "confirmed")}
              >
                Xác nhận
              </button>
            )}
            {row.status !== "cancelled" && (
              <button
                className="ui-btn ui-btn-danger ui-btn-sm"
                disabled={
                  updatingId === row.booking_id || paidOnlineBookingIds.has(String(row.booking_id))
                }
                title={
                  paidOnlineBookingIds.has(String(row.booking_id))
                    ? "Đơn đã thanh toán online — không hỗ trợ hoàn tiền nên không thể hủy"
                    : "Hủy đơn sẽ nhả lại ghế cho suất chiếu này"
                }
                onClick={() => changeStatus(row, "cancelled")}
              >
                Hủy
              </button>
            )}
            <button className="ui-btn ui-btn-ghost ui-btn-sm no-print" onClick={() => printBooking(row)}>
              In vé
            </button>
          </>
        )}
      />

      <div className="section-title">Danh sách vé (Ticket)</div>
      <div className="ui-field" style={{ maxWidth: 380, marginBottom: 10 }}>
        <input
          placeholder="🔍 Tìm theo mã đơn, ID vé, mã vé, tên khách hoặc tên phim..."
          value={ticketKw}
          onChange={(e) => setTicketKw(e.target.value)}
        />
      </div>
      <DataTable
        rows={filteredTickets}
        loading={tickets.loading}
        error={tickets.error}
        emptyText={ticketKw ? "Không tìm thấy vé nào khớp." : undefined}
        columns={[
          { key: "ticket_id", label: "ID" },
          { key: "ticket_code", label: "Mã vé", render: (v) => v || "—" },
          { key: "booking_id", label: "Đơn #" },
          {
            key: "customer_name",
            label: "Khách hàng",
            render: (_v, row) => customerNameForBooking(row.booking_id),
          },
          {
            key: "showtime_id",
            label: "Phim / Suất chiếu",
            render: (v) => {
              const showtime = showtimeById[String(v)];
              if (!showtime) return `#${v}`;
              const movie = movieById[String(showtime.movie_id)];
              const room = roomById[String(showtime.room_id)];
              return (
                <>
                  <div>{movie?.title || `Phim #${showtime.movie_id}`}</div>
                  <div className="page-sub" style={{ margin: 0 }}>
                    {showtime.show_date} · {showtime.start_time?.slice(0, 5)} ·{" "}
                    {room?.room_name || `Phòng #${showtime.room_id}`}
                  </div>
                </>
              );
            },
          },
          {
            key: "seat_id",
            label: "Ghế",
            render: (v) => seatById[String(v)]?.seat_number || `#${v}`,
          },
          {
            key: "ticket_price",
            label: "Giá vé",
            render: (v) => (v != null ? Number(v).toLocaleString("vi-VN") + " đ" : "—"),
          },
          {
            key: "is_picked_up",
            label: "Nhận vé",
            render: (v) => (
              <span className={"et-badge " + (v ? "ok" : "pending")}>
                {v ? "Đã nhận" : "Chưa nhận"}
              </span>
            ),
          },
        ]}
      />
    </>
  );
}