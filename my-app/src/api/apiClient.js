// src/api/apiClient.js
// Client dùng chung để gọi mọi API CRUD thật của backend NestJS (Câu 4).
export const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Lỗi HTTP ${res.status}`);
  }
  return res.json();
}

export function getList(path) {
  return fetch(`${API_BASE}/${path}`).then(handleResponse);
}

export function getOne(path, id) {
  return fetch(`${API_BASE}/${path}/${id}`).then(handleResponse);
}

export function createItem(path, dto) {
  return fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }).then(handleResponse);
}

// method mặc định PATCH; endpoint tickets dùng PUT nên cho phép override khi cần.
export function updateItem(path, id, dto, method = "PATCH") {
  return fetch(`${API_BASE}/${path}/${id}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }).then(handleResponse);
}

export function removeItem(path, id) {
  return fetch(`${API_BASE}/${path}/${id}`, { method: "DELETE" }).then(
    handleResponse,
  );
}
