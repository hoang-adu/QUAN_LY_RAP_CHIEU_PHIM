// src/layout/Topbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, clearAuth } from "../api/auth";
import "./layout.css";

const ROLE_LABEL = {
  admin: "Quản trị viên",
  employee: "Nhân viên",
};

export default function Topbar() {
  const navigate = useNavigate();
  const auth = getAuth();
  const userName = auth?.full_name || "Người dùng";
  const userRole = ROLE_LABEL[auth?.role] || "—";

  const initials = userName
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div className="qlrcp-topbar">
      <input
        className="qlrcp-search-box"
        placeholder="🔍  Tìm kiếm phim, mã suất chiếu..."
      />
      <div className="qlrcp-top-actions">
        <div className="qlrcp-bell" title="Thông báo">
          🔔
        </div>
        <div className="qlrcp-user">
          <div className="qlrcp-avatar">{initials}</div>
          <div>
            <div className="qlrcp-user-name">{userName}</div>
            <div className="qlrcp-user-role">{userRole}</div>
          </div>
        </div>
        <button className="qlrcp-logout-btn" onClick={handleLogout} title="Đăng xuất">
          ⏻
        </button>
      </div>
    </div>
  );
}
