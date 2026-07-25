// src/api/apiClient.js
// Client dùng chung để gọi mọi API CRUD thật của backend NestJS (Câu 4).
import { getAuth, clearAuth } from "./auth";

export const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:3000";

function authHeaders() {
  const auth = getAuth();
  return auth?.access_token
    ? { Authorization: `Bearer ${auth.access_token}` }
    : {};
}

async function handleResponse(res) {
  if (res.status === 401) {
    // Token hết hạn hoặc không hợp lệ -> bắt đăng nhập lại
    clearAuth();
    window.location.href = "/login";
    throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Lỗi HTTP ${res.status}`);
  }
  return res.json();
}

export function getList(path) {
  return fetch(`${API_BASE}/${path}`, { headers: { ...authHeaders() } }).then(
    handleResponse,
  );
}

export function getOne(path, id) {
  return fetch(`${API_BASE}/${path}/${id}`, {
    headers: { ...authHeaders() },
  }).then(handleResponse);
}

export function createItem(path, dto) {
  return fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(dto),
  }).then(handleResponse);
}

export function updateItem(path, id, dto) {
  return fetch(`${API_BASE}/${path}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(dto),
  }).then(handleResponse);
}

export function removeItem(path, id) {
  return fetch(`${API_BASE}/${path}/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  }).then(handleResponse);
}
