// src/layout/CustomerRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, isCustomer } from "../api/auth";

export default function CustomerRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isCustomer()) {
    return <Navigate to="/" replace />;
  }
  return children;
}
