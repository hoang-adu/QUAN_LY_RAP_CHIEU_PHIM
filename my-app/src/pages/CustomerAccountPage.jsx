// src/pages/CustomerAccountPage.jsx
// Trang tài khoản dành cho khách hàng sau khi đăng nhập (không dùng chung
// dashboard Sidebar/Topbar của Admin/Nhân viên — khách hàng không có quyền
// truy cập các trang quản trị).
import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, clearAuth } from "../api/auth";
import logo from "../assects/logo-mattroinho.png";
import "./login.css";
import "./customerAccount.css";

export default function CustomerAccountPage() {
  const navigate = useNavigate();
  const auth = getAuth();

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-header__inner">
          <div className="login-header__brand">
            <img src={logo} alt="Logo" />
            <span>RẠP PHIM MẶT TRỜI NHỎ</span>
          </div>
        </div>
      </header>

      <div className="account-page">
        <div className="account-card">
          <div className="account-avatar">
            {(auth?.full_name || "?").charAt(0).toUpperCase()}
          </div>
          <h2>{auth?.full_name || "Khách hàng"}</h2>
          <p className="account-sub">Tài khoản khách hàng</p>

          <div className="account-info">
            <div className="account-info-row">
              <span>Email</span>
              <strong>{auth?.email || "—"}</strong>
            </div>
            <div className="account-info-row">
              <span>Số điện thoại</span>
              <strong>{auth?.phone || "—"}</strong>
            </div>
            <div className="account-info-row">
              <span>Điểm tích lũy</span>
              <strong>{auth?.points ?? 0}</strong>
            </div>
          </div>

          <button className="login-submit" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
