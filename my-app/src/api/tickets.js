// src/api/tickets.js
// Gọi API tra cứu vé theo MÃ VÉ và xác nhận đã đưa vé tại quầy (Phase 3:
// mã vé + check-in). Không dùng chung apiClient CRUD vì đây là 2 hành động
// đặc thù (lookup / check-in) chứ không phải create/update/delete thường.
import { API_BASE } from "./apiClient";
import { getAuth, clearAuth } from "./auth";

function authHeaders() {
  const auth = getAuth();
  return auth?.access_token
    ? { Authorization: `Bearer ${auth.access_token}` }
    : {};
}

async function handleResponse(res) {
  if (res.status === 401) {
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

// Tra cứu toàn bộ vé (tất cả ghế) ứng với 1 mã vé — dùng để xem trước
// thông tin trước khi xác nhận đưa vé.
export function lookupTicketsByCode(code) {
  return fetch(`${API_BASE}/tickets/lookup/${encodeURIComponent(code)}`, {
    headers: { ...authHeaders() },
  }).then(handleResponse);
}

// Xác nhận đã đưa vé thật tại quầy cho toàn bộ vé thuộc mã này.
export function checkInByCode(code) {
  return fetch(`${API_BASE}/tickets/check-in/${encodeURIComponent(code)}`, {
    method: "POST",
    headers: { ...authHeaders() },
  }).then(handleResponse);
}