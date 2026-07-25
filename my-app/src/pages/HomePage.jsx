// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { getList } from "../api/apiClient";
import "./table.css";

// Trang chủ: gọi song song nhiều API thật để đếm số lượng bản ghi hiện có.
const STAT_SOURCES = [
  { key: "movies", label: "Phim", icon: "🎞️" },
  { key: "rooms", label: "Phòng chiếu", icon: "🏛️" },
  { key: "showtimes", label: "Suất chiếu", icon: "🕒" },
  { key: "bookings", label: "Đơn đặt vé", icon: "🎟️" },
  { key: "customers", label: "Khách hàng", icon: "👤" },
  { key: "employees", label: "Nhân viên", icon: "🧑‍💼" },
  { key: "products", label: "Sản phẩm", icon: "🍿" },
];

export default function HomePage() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all(
      STAT_SOURCES.map((s) =>
        getList(s.key)
          .then((data) => [s.key, Array.isArray(data) ? data.length : 0])
          .catch(() => [s.key, null]),
      ),
    )
      .then((entries) => {
        if (!mounted) return;
        const obj = {};
        entries.forEach(([k, v]) => (obj[k] = v));
        setCounts(obj);
      })
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Trang chủ</div>
          <div className="page-sub">
            Tổng quan hệ thống — số liệu 
          </div>
        </div>
      </div>

      {loading && <div className="et-status">Đang tải số liệu...</div>}
      {error && (
        <div className="et-status et-error">
          Không thể kết nối tới API: {error}. Kiểm tra backend đã chạy ở
          http://localhost:3000 và đã bật CORS chưa.
        </div>
      )}

      {!loading && !error && (
        <div className="stat-grid">
          {STAT_SOURCES.map((s) => (
            <div className="stat-card" key={s.key}>
              <div className="num">
                {counts[s.key] === null ? "—" : counts[s.key] ?? "…"}
              </div>
              <div className="label">
                {s.icon} {s.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
