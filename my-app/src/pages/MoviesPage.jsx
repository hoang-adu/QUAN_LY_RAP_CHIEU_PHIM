// src/pages/MoviesPage.jsx
// Màn hình mẫu Câu 5 — "Quản lý Phim"
// Dữ liệu lấy trực tiếp từ API backend NestJS thật (GET/POST/PATCH/DELETE /movies).
import React, { useMemo, useState } from "react";
import useApiList from "../api/useApiList";
import { createItem, updateItem, removeItem } from "../api/apiClient";
import FormModal from "./FormModal";
import "./MoviesPage.css";
import "./table.css";

const TABS = ["Toàn bộ", "Đang chiếu", "Sắp chiếu", "Ngừng chiếu"];

const MOVIE_FIELDS = [
  { key: "title", label: "Tên phim", required: true },
  { key: "genre", label: "Thể loại" },
  { key: "duration", label: "Thời lượng (phút)", type: "number" },
  { key: "director", label: "Đạo diễn" },
  { key: "actors", label: "Diễn viên", type: "textarea" },
  { key: "release_date", label: "Ngày khởi chiếu", type: "date" },
  { key: "description", label: "Mô tả", type: "textarea" },
  { key: "poster", label: "Link ảnh poster", placeholder: "https://..." },
];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

export default function MoviesPage() {
  const { rows: movies, loading, error, reload } = useApiList("movies");
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("Toàn bộ");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  const filtered = useMemo(
    () =>
      movies.filter((m) =>
        (m.title || "").toLowerCase().includes(keyword.toLowerCase()),
      ),
    [movies, keyword],
  );

  const openCreate = () => {
    setEditingMovie(null);
    setModalOpen(true);
  };

  const openEdit = (movie) => {
    setEditingMovie(movie);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editingMovie) {
      await updateItem("movies", editingMovie.movie_id, payload);
    } else {
      await createItem("movies", payload);
    }
    reload();
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`Xóa phim "${movie.title}"?`)) return;
    try {
      await removeItem("movies", movie.movie_id);
      reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Quản lý Phim</div>
          <div className="page-sub">
            Danh sách phim đang lưu trong hệ thống
          </div>
        </div>
        <button className="mv-btn-add" onClick={openCreate}>
          + Thêm phim mới
        </button>
      </div>

      <div className="mv-filter-row">
        <div className="mv-filter-field grow">
          <label>Tìm theo tên phim</label>
          <input
            type="text"
            placeholder="VD: Avengers, Interstellar..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="mv-filter-field">
          <label>Từ ngày khởi chiếu</label>
          <input type="date" />
        </div>
        <div className="mv-filter-field">
          <label>Đến ngày</label>
          <input type="date" />
        </div>
        <button className="mv-btn-search">Tìm kiếm</button>
      </div>

      <div className="mv-tabs">
        {TABS.map((t) => (
          <div
            key={t}
            className={"mv-tab" + (activeTab === t ? " active" : "")}
            onClick={() => setActiveTab(t)}
          >
            {t}
            {t === "Toàn bộ" ? ` (${filtered.length})` : ""}
          </div>
        ))}
      </div>

      {loading && <div className="et-status">Đang tải dữ liệu phim...</div>}
      {error && (
        <div className="et-status et-error">
          Không thể kết nối tới API: {error}. Kiểm tra backend đã chạy ở
          http://localhost:3000 và đã bật CORS chưa.
        </div>
      )}

      {!loading && !error && (
        <div className="mv-card-grid">
          {filtered.map((m, idx) => (
            <div className="mv-card" key={m.movie_id ?? idx}>
              <div className={"mv-poster " + (idx % 2 === 0 ? "p1" : "p2")}>
                🎬
              </div>
              <div className="mv-card-body">
                <div className="mv-card-tag">
                  {m.genre || "Chưa phân loại"} · {m.duration ?? "?"} phút
                </div>
                <div className="mv-card-title">{m.title}</div>
                <div className="mv-card-meta">
                  🎬 Đạo diễn: {m.director || "—"}
                </div>
                <div className="mv-card-meta">
                  📅 Khởi chiếu: {formatDate(m.release_date)}
                </div>
                <div className="mv-card-actions">
                  <button className="et-btn-edit" onClick={() => openEdit(m)}>
                    Sửa
                  </button>
                  <button className="et-btn-delete" onClick={() => handleDelete(m)}>
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="mv-card mv-add-new" onClick={openCreate}>
            <div className="mv-plus">+</div> Thêm phim mới
          </div>
        </div>
      )}

      <FormModal
        open={modalOpen}
        title={editingMovie ? "Sửa thông tin phim" : "Thêm phim mới"}
        fields={MOVIE_FIELDS}
        initialValues={editingMovie}
        submitLabel={editingMovie ? "Lưu thay đổi" : "Thêm phim"}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
