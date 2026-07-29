// src/layout/Topbar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, clearAuth } from "../api/auth";
import "./layout.css";

const ROLE_LABEL = {
  admin: "Quản trị viên",
  employee: "Nhân viên",
};

// Mẫu mã vé hệ thống đang sinh ra, vd. "VE-8K3F2Q" (xem
// TicketsService.generateUniqueCode ở backend).
const TICKET_CODE_RE = /^VE-[A-Z0-9]+$/i;

export default function Topbar() {
  const navigate = useNavigate();
  const auth = getAuth();
  const userName = auth?.full_name || "Người dùng";
  const userRole = ROLE_LABEL[auth?.role] || "—";
  const [query, setQuery] = useState("");

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

  // Ô search dùng chung mọi trang — không tự lọc dữ liệu ở đây (mỗi trang
  // đã có ô lọc riêng, chi tiết hơn), mà điều hướng tới đúng trang rồi
  // truyền từ khoá qua query string để trang đó tự prefill vào ô lọc của
  // nó, tránh viết trùng logic tìm kiếm ở 2 nơi.
  function handleSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    if (TICKET_CODE_RE.test(q)) {
      // Đúng định dạng mã vé -> vào thẳng trang Nhận vé và tự tra cứu luôn.
      navigate(`/tickets/checkin?code=${encodeURIComponent(q.toUpperCase())}`);
    } else {
      // Mã đơn (số), tên/SĐT khách hàng -> trang Đặt vé & Vé, prefill vào
      // ô lọc của cả bảng đơn lẫn bảng vé.
      navigate(`/bookings?q=${encodeURIComponent(q)}`);
    }
    setQuery("");
  }

  return (
    <div className="qlrcp-topbar">
      <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex" }}>
        <input
          className="qlrcp-search-box"
          placeholder="🔍  Tìm mã vé (VE-xxxxxx), mã đơn, tên/SĐT khách..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
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