import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../api/apiClient";
import { saveAuth } from "../api/auth";
import logo from "../assects/logo-mattroinho.png";
import "./login.css";

// Ảnh nền rạp chiếu phim theo yêu cầu
const HERO_BG =
  "https://halotravel.vn/wp-content/uploads/2020/11/rap-chieu-phim-quoc-gia-o-dau.jpg";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.5 19.2c1.4-3.1 4.2-4.7 7.5-4.7s6.1 1.6 7.5 4.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <rect
        x="5"
        y="10.5"
        width="14"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 10.5V8a4 4 0 0 1 8 0v2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.6" />
      {off && (
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("account"); // "account" | "otp"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Thử đăng nhập Admin/Nhân viên trước (tài khoản dạng username)
      const empRes = await fetch(`${API_BASE}/auth/employee/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const empData = await empRes.json().catch(() => ({}));
      if (empRes.ok) {
        saveAuth(empData);
        navigate("/", { replace: true });
        return;
      }

      // Thử đăng nhập Khách hàng bằng email hoặc số điện thoại
      const custRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: username, password }),
      });
      const custData = await custRes.json().catch(() => ({}));
      if (custRes.ok) {
        saveAuth(custData);
        navigate("/account", { replace: true });
        return;
      }

      throw new Error(
        custData.message || empData.message || "Tài khoản hoặc mật khẩu không đúng",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Header trắng giữ nguyên khoảng trắng phía trên */}
<header className="login-header">
  <div className="login-header__inner">
    {/* Tên rạp phim nằm bên trái */}
    <div className="login-header__brand">
      <img src={logo} alt="Logo" />
      <span>RẠP PHIM MẶT TRỜI NHỎ</span>
    </div>
    
    {/* Icon cờ và chữ VN nằm bên phải */}
    <span className="login-header__lang">
      <svg xmlns="http://w3.org" viewBox="0 0 30 20" width="22.5" height="15">
        <rect width="30" height="20" fill="#da251d"/>
        <polygon points="15,4 16.18,7.63 20,7.63 16.91,9.88 18.09,13.51 15,11.25 11.91,13.51 13.09,9.88 10,7.63 13.82,7.63" fill="#ffff00"/>
      </svg>
      VN
    </span>
  </div>
</header>


      {/* Hero section dùng nền hình ảnh rạp phim */}
      <div
        className="login-hero"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      >
        <div className="login-hero__overlay" />

        <div className="login-hero__content">
          {/* Bên trái: Logo + Tên rạp lớn */}
          <div className="login-hero__intro">
            <img src={logo} alt="Rạp Phim Mặt Trời Nhỏ" className="login-hero__logo" />
            <h1>
              RẠP PHIM
              <br />
              MẶT TRỜI NHỎ
            </h1>
            <p>Kênh đặt vé & Quản lý rạp phim Mặt Trời Nhỏ</p>
          </div>

          {/* Bên phải: Form đăng nhập theo bố cục Lotte Mart */}
          <div className="login-card">
            <h2>Đăng nhập</h2>

            <div className="login-tabs">
              <button
                type="button"
                className={tab === "account" ? "active" : ""}
                onClick={() => setTab("account")}
              >
                Tài Khoản
              </button>
            </div>

            {tab === "account" ? (
              <form onSubmit={handleSubmit}>
                <label className="login-field">
                  <span className="login-field__icon">
                    <UserIcon />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Email/Số điện thoại*"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </label>

                <label className="login-field">
                  <span className="login-field__icon">
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Mật khẩu*"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-field__toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </label>

                <div className="login-forgot">
                  <Link to="/forgot-password" className="login-link-btn">
                    Quên mật khẩu?
                  </Link>
                </div>

                {error && <div className="login-error">{error}</div>}

                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
              </form>
            ) : (
              <div className="login-otp-note">
                Đăng nhập bằng OTP đang được phát triển. Vui lòng dùng tài khoản để đăng nhập.
              </div>
            )}

            {/* Dòng chuyển đổi sang Đăng ký tài khoản (Chuẩn theo mẫu Lotte Mart) */}
            <div className="login-footer-register">
              Quý khách chưa có tài khoản? <Link to="/register">Đăng ký tài khoản</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}