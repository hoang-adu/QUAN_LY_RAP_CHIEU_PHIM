// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getList } from "../api/apiClient";
import { isAdmin } from "../api/auth";
import "./table.css";

// Trang chủ: gọi song song nhiều API thật để đếm số lượng bản ghi hiện có.
// to: route tương ứng để bấm vào mục là chuyển sang trang quản lý mục đó.
// adminOnly: true -> chỉ admin mới được bấm vào (khớp với quyền route /employees, /stats).
const STAT_SOURCES = [
  { key: "movies", label: "Phim", icon: "🎞️", to: "/movies" },
  { key: "rooms", label: "Phòng chiếu", icon: "🏛️", to: "/rooms" },
  { key: "showtimes", label: "Suất chiếu", icon: "🕒", to: "/showtimes" },
  { key: "bookings", label: "Đơn đặt vé", icon: "🎟️", to: "/bookings" },
  { key: "customers", label: "Khách hàng", icon: "👤", to: "/customers" },
  { key: "employees", label: "Nhân viên", icon: "🧑‍💼", to: "/employees", adminOnly: true },
  { key: "products", label: "Sản phẩm", icon: "🍿", to: "/products" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const admin = isAdmin();
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
          {STAT_SOURCES.map((s) => {
            // Nhân viên (không phải admin) không có quyền vào mục Nhân viên —
            // khớp với AdminRoute + Sidebar, nên thẻ này bị khóa, không cho bấm.
            const locked = s.adminOnly && !admin;
            return (
              <div
                className={
                  "stat-card" + (locked ? " stat-card--locked" : " stat-card--clickable")
                }
                key={s.key}
                role="button"
                tabIndex={locked ? -1 : 0}
                title={locked ? "Bạn không có quyền truy cập mục này" : `Xem ${s.label}`}
                onClick={() => {
                  if (locked) return;
                  navigate(s.to);
                }}
                onKeyDown={(e) => {
                  if (!locked && (e.key === "Enter" || e.key === " ")) navigate(s.to);
                }}
              >
                <div className="num">
                  {counts[s.key] === null ? "—" : counts[s.key] ?? "…"}
                </div>
                <div className="label">
                  {s.icon} {s.label}
                  {locked && <span className="stat-card__lock"> 🔒</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}