// src/pages/ShowtimesPage.jsx
import React from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import "./table.css";

export default function ShowtimesPage() {
  const { rows, loading, error } = useApiList("showtimes");

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Suất chiếu</div>
          <div className="page-sub">Tổng quan</div>
        </div>
      </div>

      <DataTable
        rows={rows}
        loading={loading}
        error={error}
        columns={[
          { key: "showtime_id", label: "Mã suất" },
          { key: "movie_id", label: "Phim (ID)" },
          { key: "room_id", label: "Phòng (ID)" },
          { key: "show_date", label: "Ngày chiếu" },
          { key: "start_time", label: "Giờ bắt đầu" },
          { key: "end_time", label: "Giờ kết thúc" },
        ]}
      />
    </>
  );
}
