// src/layout/CustomerLayout.jsx
// Header + footer dùng chung cho khu vực khách hàng (/account, /book),
// thiết kế theo phong cách rạp chiếu phim thật (CGV / Lotte Cinema):
// thanh hotline mỏng phía trên + navbar tối màu + CTA đỏ nổi bật.
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, clearAuth } from "../api/auth";
import logo from "../assects/logo-mattroinho.png";
import "./customerLayout.css";

export default function CustomerLayout({ children }) {
  const navigate = useNavigate();
  const auth = getAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  const initial = (auth?.full_name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="cx-shell">
      {/* Navbar chính */}
      <header className="cx-nav">
        <div className="cx-nav__inner">
          <NavLink to="/book" className="cx-brand">
            <img src={logo} alt="Logo" />
            <span>
              RẠP PHIM
              <em>MẶT TRỜI NHỎ</em>
            </span>
          </NavLink>

          <nav className={"cx-links" + (menuOpen ? " open" : "")}>
            <NavLink
              to="/book"
              className={({ isActive }) => "cx-link" + (isActive ? " active" : "")}
              onClick={() => setMenuOpen(false)}
            >
              Lịch chiếu
            </NavLink>
            <NavLink
              to="/account"
              className={({ isActive }) => "cx-link" + (isActive ? " active" : "")}
              onClick={() => setMenuOpen(false)}
            >
              Vé của tôi
            </NavLink>
          </nav>

          <div className="cx-actions">
            <NavLink to="/book" className="cx-cta">
              🎬 Đặt vé ngay
            </NavLink>

            <div className="cx-user">
              <div className="cx-user__avatar">{initial}</div>
              <div className="cx-user__meta">
                <span className="cx-user__name">{auth?.full_name || "Khách"}</span>
                <span className="cx-user__points">⭐ {auth?.points ?? 0} điểm</span>
              </div>
            </div>
            <button className="cx-logout" onClick={handleLogout} title="Đăng xuất">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              className={"cx-burger" + (menuOpen ? " open" : "")}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Mở menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <main className="cx-content">{children}</main>

      <footer className="cx-footer">
        <div className="cx-footer__inner">
          <div className="cx-footer__brand">
            <img src={logo} alt="Logo" />
            <span>RẠP PHIM MẶT TRỜI NHỎ</span>
          </div>
          <p>Vé xem phim online 24/7 — Trải nghiệm điện ảnh trọn vẹn.</p>
          <p className="cx-footer__copy">© {new Date().getFullYear()} Rạp Phim Mặt Trời Nhỏ. Đã đăng ký.</p>
        </div>
      </footer>
    </div>
  );
}