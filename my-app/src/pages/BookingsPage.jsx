// src/pages/BookingsPage.jsx
import React from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import "./table.css";

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const cls = s === "confirmed" ? "ok" : s === "cancelled" ? "cancel" : "pending";
  return <span className={"et-badge " + cls}>{status || "—"}</span>;
}

export default function BookingsPage() {
  const bookings = useApiList("bookings");
  const tickets = useApiList("tickets");

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Đặt vé & Vé</div>
        </div>
      </div>

      <div className="section-title">Danh sách đơn đặt vé (Booking)</div>
      <DataTable
        rows={bookings.rows}
        loading={bookings.loading}
        error={bookings.error}
        columns={[
          { key: "booking_id", label: "Mã đơn" },
          { key: "customer_id", label: "Khách hàng (ID)" },
          { key: "booking_date", label: "Ngày đặt" },
          { key: "total_amount", label: "Tổng tiền" },
          { key: "status", label: "Trạng thái", render: statusBadge },
        ]}
      />

      <div className="section-title">Danh sách vé (Ticket)</div>
      <DataTable
        rows={tickets.rows}
        loading={tickets.loading}
        error={tickets.error}
        columns={[
          { key: "ticket_id", label: "Mã vé" },
          { key: "booking_id", label: "Đơn đặt vé (ID)" },
          { key: "showtime_id", label: "Suất chiếu (ID)" },
          { key: "seat_id", label: "Ghế (ID)" },
          { key: "ticket_price", label: "Giá vé" },
        ]}
      />
    </>
  );
}
