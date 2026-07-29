// src/api/ticketPrices.js
// Gọi API quản lý giá vé (backend module `ticket-prices`). Không dùng
// chung apiClient CRUD id-based vì đây là API append-only theo seat_type
// (GET current / GET history / POST đổi giá), không có PATCH/DELETE.
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

// Giá đang áp dụng cho từng loại ghế -> { standard: 70000, vip: 75000, couple: 150000 }
export function getCurrentPrices() {
  return fetch(`${API_BASE}/ticket-prices/current`, {
    headers: { ...authHeaders() },
  }).then(handleResponse);
}

// Lịch sử đổi giá (toàn bộ, hoặc lọc theo 1 loại ghế).
export function getPriceHistory(seatType) {
  const qs = seatType ? `?seat_type=${encodeURIComponent(seatType)}` : "";
  return fetch(`${API_BASE}/ticket-prices/history${qs}`, {
    headers: { ...authHeaders() },
  }).then(handleResponse);
}

// Đổi giá (chỉ admin) — tạo 1 mức giá mới, có hiệu lực ngay cho vé bán
// TỪ THỜI ĐIỂM NÀY trở đi. Vé đã bán trước đó không đổi.
export function changeTicketPrice({ seat_type, price, note }) {
  return fetch(`${API_BASE}/ticket-prices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ seat_type, price, note }),
  }).then(handleResponse);
}
