// src/pages/RoomsPage.jsx
// Phòng chiếu là dữ liệu CỐ ĐỊNH: rạp chỉ có đúng 5 phòng, mỗi phòng cố định
// 80 ghế — không Thêm/Sửa/Xóa phòng hay ghế qua giao diện.
import React, { useEffect, useMemo, useState } from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import { SEAT_TYPE_LABELS } from "../utils/seatPricing";
import { getCurrentPrices } from "../api/ticketPrices";
import "./table.css";

export default function RoomsPage() {
  const rooms = useApiList("rooms");
  const seats = useApiList("seats");
  const [roomFilter, setRoomFilter] = useState("");
  const [seatTypeFilter, setSeatTypeFilter] = useState("");

  // Giá vé hiện hành lấy TRỰC TIẾP từ API quản lý giá (nguồn sự thật thật
  // sự, có thể đổi bất cứ lúc nào ở trang "Quản lý giá vé") — không dùng
  // hằng số hardcode cũ nữa, để cột "Giá vé" ở đây luôn khớp với giá đang
  // áp dụng thật, tránh hiển thị nhầm giá cũ sau khi admin đổi giá.
  const [currentPrices, setCurrentPrices] = useState({});
  useEffect(() => {
    getCurrentPrices()
      .then(setCurrentPrices)
      .catch(() => setCurrentPrices({}));
  }, []);

  const roomNameById = Object.fromEntries(
    rooms.rows.map((r) => [String(r.room_id), r.room_name]),
  );

  // Danh sách loại ghế cho dropdown lọc — lấy từ chính dữ liệu ghế thật
  // (không hardcode 3 loại cố định), để tự thích ứng nếu sau này có thêm/
  // bớt loại ghế mà không cần sửa code trang này.
  const seatTypeOptions = useMemo(() => {
    const set = new Set(seats.rows.map((s) => s.seat_type).filter(Boolean));
    return Array.from(set).sort();
  }, [seats.rows]);

  const filteredSeats = useMemo(() => {
    return seats.rows.filter((s) => {
      if (roomFilter && String(s.room_id) !== String(roomFilter)) return false;
      if (seatTypeFilter && s.seat_type !== seatTypeFilter) return false;
      return true;
    });
  }, [seats.rows, roomFilter, seatTypeFilter]);

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
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        <div className="ui-field" style={{ maxWidth: 260, marginBottom: 0 }}>
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
        <div className="ui-field" style={{ maxWidth: 260, marginBottom: 0 }}>
          <label>Lọc theo loại ghế</label>
          <select value={seatTypeFilter} onChange={(e) => setSeatTypeFilter(e.target.value)}>
            <option value="">-- Tất cả loại ghế --</option>
            {seatTypeOptions.map((t) => (
              <option key={t} value={t}>
                {SEAT_TYPE_LABELS[t] || t}
              </option>
            ))}
          </select>
        </div>
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
            render: (_v, row) =>
              (currentPrices[row.seat_type] ?? currentPrices.standard ?? 0).toLocaleString(
                "vi-VN",
              ) + " đ",
          },
        ]}
      />
    </>
  );
}