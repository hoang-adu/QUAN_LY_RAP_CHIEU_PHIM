// src/layout/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, isCustomer } from "../api/auth";

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  // Dashboard này chỉ dành cho Admin/Nhân viên — khách hàng đăng nhập
  // thì đưa về trang tài khoản riêng, không cho thấy các trang quản trị.
  if (isCustomer()) {
    return <Navigate to="/account" replace />;
  }
  return children;
}
