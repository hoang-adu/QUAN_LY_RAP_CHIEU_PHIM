// src/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import "./layout.css";

// Mỗi mục menu trỏ tới 1 route thật (xem src/App.js) — mọi trang đều gọi API thật ở Câu 4.
const MENU_GROUPS = [
  {
    section: null,
    items: [{ to: "/", label: "Trang chủ", icon: "🏠" }],
  },
  {
    section: "Vận hành rạp",
    items: [
      { to: "/movies", label: "Quản lý phim", icon: "🎞️" },
      { to: "/rooms", label: "Phòng chiếu & Ghế", icon: "🏛️" },
      { to: "/showtimes", label: "Suất chiếu", icon: "🕒" },
    ],
  },
  {
    section: "Bán vé",
    items: [
      { to: "/bookings", label: "Đặt vé & Vé", icon: "🎟️" },
      { to: "/payments", label: "Thanh toán", icon: "💳" },
      { to: "/products", label: "Sản phẩm & Đồ ăn", icon: "🍿" },
    ],
  },
  {
    section: "Hệ thống",
    items: [
      { to: "/customers", label: "Khách hàng", icon: "👤" },
      { to: "/employees", label: "Nhân viên", icon: "🧑‍💼" },
      { to: "/stats", label: "Thống kê", icon: "📊" },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="qlrcp-sidebar">
      <div className="qlrcp-brand">
        <div className="qlrcp-brand-badge">🎬</div>
        <div className="qlrcp-brand-text">
          <b>QLRCP Admin</b>
          <span>QUẢN LÝ RẠP CHIẾU PHIM</span>
        </div>
      </div>

      <nav className="qlrcp-nav">
        {MENU_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {group.section && (
              <div className="qlrcp-nav-section">{group.section}</div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  "qlrcp-nav-item" + (isActive ? " active" : "")
                }
              >
                <span className="ic">{item.icon}</span> {item.label}
              </NavLink>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="qlrcp-sidebar-foot">© 2026 Quản lý Rạp Chiếu Phim</div>
    </aside>
  );
}
