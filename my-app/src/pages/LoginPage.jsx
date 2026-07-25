// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api/apiClient";
import { saveAuth } from "../api/auth";
import "./login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/employee/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Email hoặc mật khẩu không đúng");
      }
      saveAuth(data);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
<div className="login-brand">
  <img src="https://media-cdn-v2.laodong.vn/Storage/newsportal/2019/4/2/666385/11.jpg" alt="Logo rạp chiếu phim" className="login-badge" />
  <div>
    <b><span>QUẢN LÝ RẠP CHIẾU PHIM</span></b>
  </div>
</div>

        <h1>Đăng nhập</h1>
        <p className="login-sub">
          Dành cho Quản trị viên (Admin) và Nhân viên rạp
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            required
            placeholder="vd: cuong.le@cinema.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Mật khẩu</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="login-hint">
          Tài khoản mẫu — Admin: mattroinho@cinema.com / admin123 · Nhân
          viên: dung.pham@cinema.com / nhanvien123
        </div>
      </div>
    </div>
  );
}
