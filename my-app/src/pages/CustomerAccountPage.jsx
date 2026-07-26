// src/pages/CustomerAccountPage.jsx
// Trang tài khoản dành cho khách hàng sau khi đăng nhập (không dùng chung
// dashboard Sidebar/Topbar của Admin/Nhân viên — khách hàng không có quyền
// truy cập các trang quản trị).
import React from "react";
import { Link } from "react-router-dom";
import { getAuth } from "../api/auth";
import CustomerLayout from "../layout/CustomerLayout";
import "./customerAccount.css";

export default function CustomerAccountPage() {
  const auth = getAuth();

  return (
    <CustomerLayout>
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

          <Link to="/book" className="login-submit account-book-link">
            🎬 Đặt vé xem phim
          </Link>
        </div>
      </div>
    </CustomerLayout>
  );
}
