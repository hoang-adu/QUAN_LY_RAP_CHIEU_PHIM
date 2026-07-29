// src/pages/ForgotPasswordPage.jsx
// Hệ thống chưa hỗ trợ tự đặt lại mật khẩu qua email/SMS — trang này hướng
// dẫn người dùng liên hệ trực tiếp Admin qua số điện thoại để được hỗ trợ.
import React from "react";
import { Link } from "react-router-dom";
import logo from "../assects/logo-mattroinho.png";
import "./login.css";

const HERO_BG =
  "https://halotravel.vn/wp-content/uploads/2020/11/rap-chieu-phim-quoc-gia-o-dau.jpg";

const ADMIN_CONTACT_PHONE = "0956789012";
const ADMIN_CONTACT_EMAIL = "mattroinho@cinema.com";

export default function ForgotPasswordPage() {
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
            <h2>Quên mật khẩu?</h2>

            <div className="login-info fp-note">
              Hệ thống hiện chưa hỗ trợ tự đặt lại mật khẩu qua email/SMS. Vui lòng liên hệ trực
              tiếp Admin theo thông tin bên dưới để được hỗ trợ đặt lại mật khẩu thủ công.
            </div>

            <div className="fp-contact">
              <div className="fp-contact__row">
                <span className="fp-contact__icon">📞</span>
                <div>
                  <div className="fp-contact__label">Số điện thoại</div>
                  <a className="fp-contact__value" href={`tel:${ADMIN_CONTACT_PHONE}`}>
                    {ADMIN_CONTACT_PHONE}
                  </a>
                </div>
              </div>
              <div className="fp-contact__row">
                <span className="fp-contact__icon">✉️</span>
                <div>
                  <div className="fp-contact__label">Email</div>
                  <a className="fp-contact__value" href={`mailto:${ADMIN_CONTACT_EMAIL}`}>
                    {ADMIN_CONTACT_EMAIL}
                  </a>
                </div>
              </div>
            </div>

            <div className="login-footer-register">
              <Link to="/login">← Quay lại đăng nhập</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
