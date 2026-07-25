// src/pages/MoviesPage.jsx
// Quản lý Phim — đầy đủ Xem / Thêm / Sửa / Xóa, dữ liệu thật từ API /movies.
import React from "react";
import useApiList from "../api/useApiList";
import CrudSection from "../components/CrudSection";
import { isAdmin } from "../api/auth";
import "./table.css";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

const FIELDS = [
  { name: "title", label: "Tên phim", required: true, fullWidth: true },
  { name: "genre", label: "Thể loại", placeholder: "VD: Hành động, Viễn tưởng..." },
  { name: "duration", label: "Thời lượng (phút)", type: "number" },
  { name: "director", label: "Đạo diễn" },
  { name: "release_date", label: "Ngày khởi chiếu", type: "date" },
  { name: "poster", label: "Ảnh poster (URL)", placeholder: "vd: avengers.jpg" },
  { name: "actors", label: "Diễn viên", type: "textarea", fullWidth: true },
  { name: "description", label: "Mô tả", type: "textarea", fullWidth: true },
];

export default function MoviesPage() {
  const { rows, loading, error, reload } = useApiList("movies");
  const admin = isAdmin();

  return (
    <CrudSection
      title="Quản lý Phim"
      subtitle="Dữ liệu thật từ API /movies"
      apiPath="movies"
      idKey="movie_id"
      rows={rows}
      loading={loading}
      error={error}
      reload={reload}
      fields={FIELDS}
      canCreate={admin}
      canEdit={admin}
      canDelete={admin}
      toDto={(v) => ({
        ...v,
        duration: v.duration === "" ? null : Number(v.duration),
      })}
      columns={[
        { key: "movie_id", label: "Mã phim" },
        { key: "title", label: "Tên phim" },
        { key: "genre", label: "Thể loại" },
        { key: "duration", label: "Thời lượng", render: (v) => (v ? `${v} phút` : "—") },
        { key: "director", label: "Đạo diễn" },
        { key: "release_date", label: "Khởi chiếu", render: formatDate },
      ]}
    />
  );
}
