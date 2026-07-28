import React, { useState } from "react";
import { Link } from "react-router-dom";
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

export default function BookingsPage() {
  const bookings = useApiList("bookings");
  const tickets = useApiList("tickets");
  const customers = useApiList("customers");
  const toast = useToast();
  const [updatingId, setUpdatingId] = useState(null);

  const customerNameById = Object.fromEntries(
    customers.rows.map((c) => [String(c.customer_id), c.full_name]),
  );

  async function changeStatus(row, status) {
    setUpdatingId(row.booking_id);
    try {
      await updateItem("bookings", row.booking_id, { status });
      toast.success(`Đã cập nhật đơn #${row.booking_id} -> ${status}.`);
      bookings.reload();
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
      <DataTable
        rows={bookings.rows}
        loading={bookings.loading}
        error={bookings.error}
        columns={[
          { key: "booking_id", label: "Mã đơn" },
          {
            key: "customer_id",
            label: "Khách hàng",
            render: (v) => customerNameById[String(v)] || (v ? `#${v}` : "—"),
          },
          { key: "booking_date", label: "Ngày đặt" },
          {
            key: "total_amount",
            label: "Tổng tiền",
            render: (v) => (v != null ? Number(v).toLocaleString("vi-VN") + " đ" : "—"),
          },
          { key: "status", label: "Trạng thái", render: statusBadge },
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
                disabled={updatingId === row.booking_id}
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
      <DataTable
        rows={tickets.rows}
        loading={tickets.loading}
        error={tickets.error}
        columns={[
          { key: "ticket_id", label: "ID" },
          { key: "ticket_code", label: "Mã vé", render: (v) => v || "—" },
          { key: "booking_id", label: "Đơn đặt vé (ID)" },
          { key: "showtime_id", label: "Suất chiếu (ID)" },
          { key: "seat_id", label: "Ghế (ID)" },
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