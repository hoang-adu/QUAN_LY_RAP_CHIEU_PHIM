// src/pages/RoomsPage.jsx
// Phòng chiếu là dữ liệu CỐ ĐỊNH: rạp chỉ có đúng 5 phòng, mỗi phòng cố định
// 80 ghế — không Thêm/Sửa/Xóa phòng hay ghế qua giao diện.
import React, { useMemo, useState } from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import { priceForSeatType, SEAT_TYPE_LABELS } from "../utils/seatPricing";
import "./table.css";

export default function RoomsPage() {
  const rooms = useApiList("rooms");
  const seats = useApiList("seats");
  const [roomFilter, setRoomFilter] = useState("");

  const roomNameById = Object.fromEntries(
    rooms.rows.map((r) => [String(r.room_id), r.room_name]),
  );

  const filteredSeats = useMemo(() => {
    if (!roomFilter) return seats.rows;
    return seats.rows.filter((s) => String(s.room_id) === String(roomFilter));
  }, [seats.rows, roomFilter]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Phòng chiếu</div>
        </div>
      </div>

      <div className="section-title">Danh sách phòng chiếu</div>
      <DataTable
        rows={rooms.rows}
        loading={rooms.loading}
        error={rooms.error}
        columns={[
          { key: "room_id", label: "Mã phòng" },
          { key: "room_name", label: "Tên phòng" },
          { key: "room_type", label: "Loại phòng" },
          { key: "seat_count", label: "Số ghế" },
        ]}
      />

      <div className="section-title">Ghế theo phòng</div>
      <div className="ui-field" style={{ maxWidth: 260, marginBottom: 14 }}>
        <label>Lọc theo phòng</label>
        <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
          <option value="">-- Tất cả phòng --</option>
          {rooms.rows.map((r) => (
            <option key={r.room_id} value={r.room_id}>
              {r.room_name}
            </option>
          ))}
        </select>
      </div>
      <DataTable
        rows={filteredSeats}
        loading={seats.loading}
        error={seats.error}
        pageSize={20}
        columns={[
          { key: "seat_id", label: "Mã ghế" },
          {
            key: "room_id",
            label: "Thuộc phòng",
            render: (v) => roomNameById[String(v)] || `#${v}`,
          },
          { key: "seat_number", label: "Số ghế" },
          {
            key: "seat_type",
            label: "Loại ghế",
            render: (v) => SEAT_TYPE_LABELS[v] || v,
          },
          {
            key: "seat_price",
            label: "Giá vé",
            render: (_v, row) => priceForSeatType(row.seat_type).toLocaleString("vi-VN") + " đ",
          },
        ]}
      />
    </>
  );
}
