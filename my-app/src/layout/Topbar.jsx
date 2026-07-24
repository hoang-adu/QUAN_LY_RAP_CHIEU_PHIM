// src/layout/Topbar.jsx
import React from "react";
import "./layout.css";

export default function Topbar({
  userName = "Nguyễn Văn A",
  userRole = "Quản trị viên",
}) {
  const initials = userName
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

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
      </div>
    </div>
  );
}
