// src/pages/RoomsPage.jsx
import React, { useState } from "react";
import useApiList from "../api/useApiList";
import { isAdmin } from "../api/auth";
import { createItem, updateItem, removeItem } from "../api/apiClient";
import DataTable from "./DataTable";
import FormModal from "./FormModal";
import "./table.css";

const ROOM_FIELDS = [
  { key: "room_name", label: "Tên phòng", required: true },
  { key: "room_type", label: "Loại phòng" },
  { key: "seat_count", label: "Số ghế", type: "number" },
];

const SEAT_FIELDS = [
  { key: "room_id", label: "Thuộc phòng (ID)", type: "number", required: true },
  { key: "seat_number", label: "Số ghế" },
  { key: "seat_type", label: "Loại ghế" },
];

export default function RoomsPage() {
  const admin = isAdmin();
  const rooms = useApiList("rooms");
  const seats = useApiList("seats");

  const [roomModal, setRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [seatModal, setSeatModal] = useState(false);
  const [editingSeat, setEditingSeat] = useState(null);

  const handleRoomSubmit = async (payload) => {
    if (editingRoom) await updateItem("rooms", editingRoom.room_id, payload);
    else await createItem("rooms", payload);
    rooms.reload();
  };

  const handleRoomDelete = async (row) => {
    if (!window.confirm(`Xóa phòng "${row.room_name}"?`)) return;
    try {
      await removeItem("rooms", row.room_id);
      rooms.reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  const handleSeatSubmit = async (payload) => {
    if (editingSeat) await updateItem("seats", editingSeat.seat_id, payload);
    else await createItem("seats", payload);
    seats.reload();
  };

  const handleSeatDelete = async (row) => {
    if (!window.confirm(`Xóa ghế "${row.seat_number || row.seat_id}"?`)) return;
    try {
      await removeItem("seats", row.seat_id);
      seats.reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Phòng chiếu & Ghế</div>
          <div className="page-sub">Tổng quan</div>
        </div>
      </div>

      <div className="page-head">
        <div className="section-title">Danh sách phòng chiếu</div>
        {admin && (
          <button
            className="page-btn-add"
            onClick={() => {
              setEditingRoom(null);
              setRoomModal(true);
            }}
          >
            + Thêm phòng
          </button>
        )}
      </div>
      <DataTable
        rows={rooms.rows}
        loading={rooms.loading}
        error={rooms.error}
        rowKey="room_id"
        columns={[
          { key: "room_id", label: "Mã phòng" },
          { key: "room_name", label: "Tên phòng" },
          { key: "room_type", label: "Loại phòng" },
          { key: "seat_count", label: "Số ghế" },
        ]}
        onEdit={
          admin
            ? (row) => {
                setEditingRoom(row);
                setRoomModal(true);
              }
            : undefined
        }
        onDelete={admin ? handleRoomDelete : undefined}
      />

      <div className="page-head">
        <div className="section-title">Danh sách ghế</div>
        {admin && (
          <button
            className="page-btn-add"
            onClick={() => {
              setEditingSeat(null);
              setSeatModal(true);
            }}
          >
            + Thêm ghế
          </button>
        )}
      </div>
      <DataTable
        rows={seats.rows}
        loading={seats.loading}
        error={seats.error}
        rowKey="seat_id"
        columns={[
          { key: "seat_id", label: "Mã ghế" },
          { key: "room_id", label: "Thuộc phòng" },
          { key: "seat_number", label: "Số ghế" },
          { key: "seat_type", label: "Loại ghế" },
        ]}
        onEdit={
          admin
            ? (row) => {
                setEditingSeat(row);
                setSeatModal(true);
              }
            : undefined
        }
        onDelete={admin ? handleSeatDelete : undefined}
      />

      <FormModal
        open={roomModal}
        title={editingRoom ? "Sửa phòng chiếu" : "Thêm phòng chiếu"}
        fields={ROOM_FIELDS}
        initialValues={editingRoom}
        submitLabel={editingRoom ? "Lưu thay đổi" : "Thêm phòng"}
        onClose={() => setRoomModal(false)}
        onSubmit={handleRoomSubmit}
      />

      <FormModal
        open={seatModal}
        title={editingSeat ? "Sửa ghế" : "Thêm ghế"}
        fields={SEAT_FIELDS}
        initialValues={editingSeat}
        submitLabel={editingSeat ? "Lưu thay đổi" : "Thêm ghế"}
        onClose={() => setSeatModal(false)}
        onSubmit={handleSeatSubmit}
      />
    </>
  );
}
