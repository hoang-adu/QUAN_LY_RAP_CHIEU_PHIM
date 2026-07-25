// src/pages/ShowtimesPage.jsx
// Suất chiếu — CRUD đầy đủ. movie_id / room_id chọn qua dropdown lấy từ
// danh sách phim & phòng đang có, tránh gõ tay ID gây sai dữ liệu.
import React from "react";
import useApiList from "../api/useApiList";
import CrudSection from "../components/CrudSection";
import { isAdmin } from "../api/auth";
import "./table.css";

export default function ShowtimesPage() {
  const showtimes = useApiList("showtimes");
  const movies = useApiList("movies");
  const rooms = useApiList("rooms");
  const admin = isAdmin();

  const movieOptions = movies.rows.map((m) => ({ value: m.movie_id, label: m.title }));
  const roomOptions = rooms.rows.map((r) => ({ value: r.room_id, label: r.room_name }));
  const movieNameById = Object.fromEntries(movies.rows.map((m) => [String(m.movie_id), m.title]));
  const roomNameById = Object.fromEntries(rooms.rows.map((r) => [String(r.room_id), r.room_name]));

  const FIELDS = [
    { name: "movie_id", label: "Phim", type: "select", options: movieOptions, required: true },
    { name: "room_id", label: "Phòng chiếu", type: "select", options: roomOptions, required: true },
    { name: "show_date", label: "Ngày chiếu", type: "date", required: true },
    { name: "start_time", label: "Giờ bắt đầu", type: "time", required: true },
    { name: "end_time", label: "Giờ kết thúc", type: "time", required: true },
  ];

  return (
    <CrudSection
      title="Suất chiếu"
      subtitle="Dữ liệu thật từ API /showtimes"
      apiPath="showtimes"
      idKey="showtime_id"
      rows={showtimes.rows}
      loading={showtimes.loading}
      error={showtimes.error}
      reload={showtimes.reload}
      fields={FIELDS}
      canCreate={admin}
      canEdit={admin}
      canDelete={admin}
      toDto={(v) => ({ ...v, movie_id: Number(v.movie_id), room_id: Number(v.room_id) })}
      searchKeys={["show_date"]}
      columns={[
        { key: "showtime_id", label: "Mã suất" },
        { key: "movie_id", label: "Phim", render: (v) => movieNameById[String(v)] || `#${v}` },
        { key: "room_id", label: "Phòng", render: (v) => roomNameById[String(v)] || `#${v}` },
        { key: "show_date", label: "Ngày chiếu" },
        { key: "start_time", label: "Giờ bắt đầu" },
        { key: "end_time", label: "Giờ kết thúc" },
      ]}
    />
  );
}
