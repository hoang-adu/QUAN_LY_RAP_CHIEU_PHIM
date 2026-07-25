
import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, isAdmin } from "../api/auth";

export default function AdminRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin()) {
    // Đã đăng nhập nhưng không phải admin -> đá về trang chủ

    return <Navigate to="/" replace />;
  }
  return children;
}
