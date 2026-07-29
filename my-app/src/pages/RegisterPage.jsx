// src/pages/RegisterPage.jsx
// Đăng ký tài khoản khách hàng — gọi POST /auth/register, rồi tự đăng nhập
// bằng POST /auth/login để đưa khách vào thẳng trang tài khoản.
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../api/apiClient";
import { saveAuth } from "../api/auth";
import logo from "../assects/logo-mattroinho.png";
import "./login.css";

const HERO_BG =
  "https://halotravel.vn/wp-content/uploads/2020/11/rap-chieu-phim-quoc-gia-o-dau.jpg";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: phone || undefined,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Đăng ký thất bại, vui lòng thử lại");
      }

      // Đăng ký xong thì tự đăng nhập luôn cho tiện
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: email, password }),
      });
      const loginData = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        // Đăng ký thành công nhưng tự đăng nhập lỗi -> để khách tự đăng nhập lại
        navigate("/login", { replace: true });
        return;
      }
      saveAuth(loginData);
      navigate("/account", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

      <div className="login-hero" style={{ backgroundImage: `url(${HERO_BG})` }}>
        <div className="login-hero__overlay" />

        <div className="login-hero__content">
          <div className="login-hero__intro">
            <img src={logo} alt="Rạp Phim Mặt Trời Nhỏ" className="login-hero__logo" />
            <h1>
              RẠP PHIM
              <br />
              MẶT TRỜI NHỎ
            </h1>
            <p>Kênh đặt vé & Quản lý rạp phim Mặt Trời Nhỏ</p>
          </div>

          <div className="login-card">
            <h2>Đăng ký tài khoản</h2>

            <form onSubmit={handleSubmit}>
              <label className="login-field">
                <input
                  type="text"
                  required
                  placeholder="Họ và tên*"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </label>

              <label className="login-field">
                <input
                  type="email"
                  required
                  placeholder="Email*"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>

              <label className="login-field">
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>

              <label className="login-field">
                <input
                  type="password"
                  required
                  placeholder="Mật khẩu* (ít nhất 6 ký tự)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </label>

              <label className="login-field">
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu*"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </label>

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? "Đang xử lý..." : "Đăng ký"}
              </button>
            </form>

            <div className="login-footer-register">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}