// src/pages/MoviesPage.jsx
// Màn hình mẫu Câu 5 — "Quản lý Phim"
// Dữ liệu lấy trực tiếp từ API backend NestJS thật (GET /movies) đã cài đặt ở Câu 4.
import React, { useMemo, useState } from "react";
import useApiList from "../api/useApiList";
import { isAdmin } from "../api/auth";
import "./MoviesPage.css";
import "./table.css";

const TABS = ["Toàn bộ", "Đang chiếu", "Sắp chiếu", "Ngừng chiếu"];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

export default function MoviesPage() {
  const { rows: movies, loading, error } = useApiList("movies");
  const admin = isAdmin();
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("Toàn bộ");

  const filtered = useMemo(
    () =>
      movies.filter((m) =>
        (m.title || "").toLowerCase().includes(keyword.toLowerCase()),
      ),
    [movies, keyword],
  );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Quản lý Phim</div>
          <div className="page-sub">
            Danh sách phim đang lưu trong hệ thống 
          </div>
        </div>
        {admin && <button className="mv-btn-add">+ Thêm phim mới</button>}
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
                <a className="mv-card-link" href={`#/movies/${m.movie_id}`}>
                  Xem chi tiết →
                </a>
              </div>
            </div>
          ))}

          {admin && (
            <div className="mv-card mv-add-new">
              <div className="mv-plus">+</div> Thêm phim mới
            </div>
          )}
        </div>
      )}
    </>
  );
}
