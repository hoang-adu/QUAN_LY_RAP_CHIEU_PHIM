// src/pages/BookingsPage.jsx
import React, { useState } from "react";
import useApiList from "../api/useApiList";
import { createItem, updateItem, removeItem } from "../api/apiClient";
import DataTable from "./DataTable";
import FormModal from "./FormModal";
import "./table.css";

const BOOKING_FIELDS = [
  { key: "customer_id", label: "Khách hàng (ID)", type: "number", required: true },
  { key: "total_amount", label: "Tổng tiền", type: "number" },
  {
    key: "status",
    label: "Trạng thái",
    type: "select",
    options: [
      { value: "pending", label: "Chờ xử lý" },
      { value: "confirmed", label: "Đã xác nhận" },
      { value: "cancelled", label: "Đã hủy" },
    ],
  },
];

const TICKET_FIELDS = [
  { key: "booking_id", label: "Đơn đặt vé (ID)", type: "number", required: true },
  { key: "showtime_id", label: "Suất chiếu (ID)", type: "number", required: true },
  { key: "seat_id", label: "Ghế (ID)", type: "number", required: true },
  { key: "ticket_price", label: "Giá vé", type: "number" },
];

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const cls = s === "confirmed" ? "ok" : s === "cancelled" ? "cancel" : "pending";
  return <span className={"et-badge " + cls}>{status || "—"}</span>;
}

export default function BookingsPage() {
  const bookings = useApiList("bookings");
  const tickets = useApiList("tickets");

  const [bookingModal, setBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [ticketModal, setTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  const handleBookingSubmit = async (payload) => {
    if (editingBooking) await updateItem("bookings", editingBooking.booking_id, payload);
    else await createItem("bookings", payload);
    bookings.reload();
  };

  const handleBookingDelete = async (row) => {
    if (!window.confirm(`Xóa đơn đặt vé #${row.booking_id}?`)) return;
    try {
      await removeItem("bookings", row.booking_id);
      bookings.reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  const handleTicketSubmit = async (payload) => {
    // Tickets controller dùng PUT cho cập nhật (không phải PATCH)
    if (editingTicket) await updateItem("tickets", editingTicket.ticket_id, payload, "PUT");
    else await createItem("tickets", payload);
    tickets.reload();
  };

  const handleTicketDelete = async (row) => {
    if (!window.confirm(`Xóa vé #${row.ticket_id}?`)) return;
    try {
      await removeItem("tickets", row.ticket_id);
      tickets.reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Đặt vé & Vé</div>
        </div>
      </div>

      <div className="page-head">
        <div className="section-title">Danh sách đơn đặt vé (Booking)</div>
        <button
          className="page-btn-add"
          onClick={() => {
            setEditingBooking(null);
            setBookingModal(true);
          }}
        >
          + Thêm đơn đặt vé
        </button>
      </div>
      <DataTable
        rows={bookings.rows}
        loading={bookings.loading}
        error={bookings.error}
        rowKey="booking_id"
        columns={[
          { key: "booking_id", label: "Mã đơn" },
          { key: "customer_id", label: "Khách hàng (ID)" },
          { key: "booking_date", label: "Ngày đặt" },
          { key: "total_amount", label: "Tổng tiền" },
          { key: "status", label: "Trạng thái", render: statusBadge },
        ]}
        onEdit={(row) => {
          setEditingBooking(row);
          setBookingModal(true);
        }}
        onDelete={handleBookingDelete}
      />

      <div className="page-head">
        <div className="section-title">Danh sách vé (Ticket)</div>
        <button
          className="page-btn-add"
          onClick={() => {
            setEditingTicket(null);
            setTicketModal(true);
          }}
        >
          + Thêm vé
        </button>
      </div>
      <DataTable
        rows={tickets.rows}
        loading={tickets.loading}
        error={tickets.error}
        rowKey="ticket_id"
        columns={[
          { key: "ticket_id", label: "Mã vé" },
          { key: "booking_id", label: "Đơn đặt vé (ID)" },
          { key: "showtime_id", label: "Suất chiếu (ID)" },
          { key: "seat_id", label: "Ghế (ID)" },
          { key: "ticket_price", label: "Giá vé" },
        ]}
        onEdit={(row) => {
          setEditingTicket(row);
          setTicketModal(true);
        }}
        onDelete={handleTicketDelete}
      />

      <FormModal
        open={bookingModal}
        title={editingBooking ? "Sửa đơn đặt vé" : "Thêm đơn đặt vé"}
        fields={BOOKING_FIELDS}
        initialValues={editingBooking}
        submitLabel={editingBooking ? "Lưu thay đổi" : "Thêm đơn"}
        onClose={() => setBookingModal(false)}
        onSubmit={handleBookingSubmit}
      />

      <FormModal
        open={ticketModal}
        title={editingTicket ? "Sửa vé" : "Thêm vé"}
        fields={TICKET_FIELDS}
        initialValues={editingTicket}
        submitLabel={editingTicket ? "Lưu thay đổi" : "Thêm vé"}
        onClose={() => setTicketModal(false)}
        onSubmit={handleTicketSubmit}
      />
    </>
  );
}
