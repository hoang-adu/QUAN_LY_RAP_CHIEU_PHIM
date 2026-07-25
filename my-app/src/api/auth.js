// src/api/auth.js
// Quản lý phiên đăng nhập của Admin/Nhân viên (lưu trong localStorage).
const STORAGE_KEY = "qlrcp_auth";

export function saveAuth({ access_token, role, full_name }) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ access_token, role, full_name }),
  );
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated() {
  return !!getAuth()?.access_token;
}

export function getRole() {
  return getAuth()?.role || null;
}

export function isAdmin() {
  return getRole() === "admin";
}
