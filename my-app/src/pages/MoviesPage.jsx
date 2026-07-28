// src/pages/MoviesPage.jsx
// Quản lý Phim — đầy đủ Xem / Thêm / Sửa / Xóa, dữ liệu thật từ API /movies.
import React from "react";
import useApiList from "../api/useApiList";
import CrudSection from "../components/CrudSection";
import "./table.css";
import "./MoviesPage.css";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

// Ảnh poster có thể trống hoặc URL bị lỗi (link hỏng, sai tên file...) —
// khi đó ẩn thẻ <img> đi và hiện icon thay thế để không hiển thị ô ảnh vỡ.
function PosterThumb({ src, alt, large }) {
  const [broken, setBroken] = React.useState(false);
  const cls = "movie-thumb" + (large ? " movie-thumb--lg" : "");
  if (!src || broken) {
    return <div className={cls + " movie-thumb--empty"}>🎬</div>;
  }
  return (
    <img
      className={cls}
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
    />
  );
}

// Nội dung modal "Xem" — giới thiệu đầy đủ về phim (chỉ xem, không sửa).
function MovieDetail({ row }) {
  return (
    <div className="movie-detail">
      <div className="movie-detail__top">
        <PosterThumb src={row.poster} alt={row.title} large />
        <div className="movie-detail__top-info">
          <div className="movie-detail__title">{row.title}</div>
          {row.genre && <span className="movie-detail__tag">{row.genre}</span>}
          <div className="movie-detail__meta">
            {row.duration ? `⏱ ${row.duration} phút` : "⏱ Chưa rõ thời lượng"}
            {" · "}📅 {formatDate(row.release_date)}
          </div>
        </div>
      </div>

      <div className="movie-detail__rows">
        <div className="movie-detail__row">
          <span>Đạo diễn</span>
          <strong>{row.director || "—"}</strong>
        </div>
        <div className="movie-detail__row">
          <span>Diễn viên</span>
          <strong>{row.actors || "—"}</strong>
        </div>
      </div>

      <div className="movie-detail__desc">
        <div className="movie-detail__desc-label">Giới thiệu phim</div>
        <p>{row.description || "Chưa có mô tả cho phim này."}</p>
      </div>
    </div>
  );
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
      renderDetail={(row) => <MovieDetail row={row} />}
      detailTitle={() => "Thông tin phim"}
      toDto={(v) => ({
        ...v,
        duration: v.duration === "" ? null : Number(v.duration),
      })}
      columns={[
        { key: "movie_id", label: "Mã phim" },
        {
          key: "poster",
          label: "Ảnh",
          render: (v, row) => <PosterThumb src={v} alt={row.title} />,
        },
        { key: "title", label: "Tên phim" },
        { key: "genre", label: "Thể loại" },
        { key: "duration", label: "Thời lượng", render: (v) => (v ? `${v} phút` : "—") },
        { key: "director", label: "Đạo diễn" },
        { key: "release_date", label: "Khởi chiếu", render: formatDate },
      ]}
    />
  );
}