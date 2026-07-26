// src/layout/CustomerLayout.jsx
// Header dùng chung cho khu vực khách hàng (/account, /book) — tách biệt
// hoàn toàn với DashboardLayout (Sidebar/Topbar) của Admin/Nhân viên.
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, clearAuth } from "../api/auth";
import logo from "../assects/logo-mattroinho.png";
import "../pages/login.css";
import "./customerLayout.css";

export default function CustomerLayout({ children }) {
  const navigate = useNavigate();
  const auth = getAuth();

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-header__inner cl-header-inner">
          <div className="login-header__brand">
            <img src={logo} alt="Logo" />
            <span>RẠP PHIM MẶT TRỜI NHỎ</span>
          </div>

          <nav className="cl-nav">
            <NavLink to="/book" className={({ isActive }) => "cl-nav-link" + (isActive ? " active" : "")}>
              Đặt vé xem phim
            </NavLink>
            <NavLink to="/account" className={({ isActive }) => "cl-nav-link" + (isActive ? " active" : "")}>
              Tài khoản của tôi
            </NavLink>
            <span className="cl-nav-name">{auth?.full_name}</span>
            <button className="cl-nav-logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>

      <div className="cl-content">{children}</div>
    </div>
  );
}
