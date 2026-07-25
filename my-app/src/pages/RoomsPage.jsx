// src/pages/RoomsPage.jsx
import React from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import "./table.css";

export default function RoomsPage() {
  const rooms = useApiList("rooms");
  const seats = useApiList("seats");

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Phòng chiếu & Ghế</div>
          <div className="page-sub">
            Tổng quan
          </div>
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

      <div className="section-title">Danh sách ghế</div>
      <DataTable
        rows={seats.rows}
        loading={seats.loading}
        error={seats.error}
        columns={[
          { key: "seat_id", label: "Mã ghế" },
          { key: "room_id", label: "Thuộc phòng" },
          { key: "seat_number", label: "Số ghế" },
          { key: "seat_type", label: "Loại ghế" },
        ]}
      />
    </>
  );
}
