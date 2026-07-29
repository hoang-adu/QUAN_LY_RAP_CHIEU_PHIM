// src/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { isAdmin, isSecurityGuard } from "../api/auth";
import "./layout.css";

// Mỗi mục menu trỏ tới 1 route thật (xem src/App.js) — mọi trang đều gọi API thật ở Câu 4.
// adminOnly: true -> chỉ hiển thị khi tài khoản đăng nhập có role = 'admin'
// hideForGuard: true -> ẩn với tài khoản có chức vụ "Bảo vệ" (không cần nghiệp vụ bán hàng)
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
      { to: "/pricing", label: "Quản lý giá vé", icon: "💰", adminOnly: true },
    ],
  },
  {
    section: "Bán vé",
    items: [
      { to: "/bookings/new", label: "Bán vé mới", icon: "➕", hideForGuard: true },
      { to: "/bookings", label: "Đặt vé & Vé", icon: "🎟️", hideForGuard: true },
      { to: "/tickets/checkin", label: "Nhận vé (mã vé)", icon: "🎫" },
      { to: "/payments", label: "Thanh toán", icon: "💳", hideForGuard: true },
      { to: "/products", label: "Sản phẩm & Đồ ăn", icon: "🍿", hideForGuard: true },
    ],
  },
  {
    section: "Hệ thống",
    items: [
      { to: "/customers", label: "Khách hàng", icon: "👤", hideForGuard: true },
      { to: "/employees", label: "Nhân viên", icon: "🧑‍💼", adminOnly: true },
      { to: "/stats", label: "Thống kê", icon: "📊", adminOnly: true },
    ],
  },
];

export default function Sidebar() {
  const admin = isAdmin();
  const guard = isSecurityGuard();

  return (
    <aside className="qlrcp-sidebar">
<div className="qlrcp-brand">
  <img src="https://media-cdn-v2.laodong.vn/Storage/newsportal/2019/4/2/666385/11.jpg" alt="Logo rạp chiếu phim" className="qlrcp-brand-badge" />
  <div className="qlrcp-brand-text">
    <b><span>QUẢN LÝ RẠP CHIẾU PHIM</span></b>
  </div>
</div>

      <nav className="qlrcp-nav">
        {MENU_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {group.section && (
              <div className="qlrcp-nav-section">{group.section}</div>
            )}
            {group.items
              .filter((item) => !item.adminOnly || admin)
              .filter((item) => !item.hideForGuard || !guard)
              .map((item) => (
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