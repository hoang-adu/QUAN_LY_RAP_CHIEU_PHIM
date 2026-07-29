// src/api/seatLocks.js
// Gọi API giữ / gia hạn / nhả / xem danh sách ghế đang bị giữ tạm thời
// (endpoint: /showtimes/:showtimeId/seat-locks) — chống 2 người cùng chọn
// trùng 1 ghế trong lúc đang điền thông tin/thanh toán.
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

// Giữ ghế (hoặc gia hạn nếu đang gọi lại trước khi hết hạn 5 phút).
export function holdSeat(showtimeId, seatId) {
  return fetch(`${API_BASE}/showtimes/${showtimeId}/seat-locks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ seat_id: Number(seatId) }),
  }).then(handleResponse);
}

// Nhả ghế chủ động (bỏ chọn / rời trang / hủy thao tác).
export function releaseSeat(showtimeId, seatId, opts = {}) {
  return fetch(`${API_BASE}/showtimes/${showtimeId}/seat-locks/${seatId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
    keepalive: !!opts.keepalive,
  }).then(handleResponse);
}

// Danh sách ghế đang bị giữ (còn hiệu lực) của 1 suất chiếu.
// Trả về: [{ seat_id, expires_at, mine }]
export function listSeatLocks(showtimeId) {
  return fetch(`${API_BASE}/showtimes/${showtimeId}/seat-locks`, {
    headers: { ...authHeaders() },
  }).then(handleResponse);
}
