// src/api/vouchers.js
// Helper gọi API đổi điểm tích lũy lấy voucher giảm giá (POST /vouchers/redeem)
// và xem danh sách voucher (GET /vouchers/mine, GET /vouchers).
import { API_BASE } from "./apiClient";
import { getAuth } from "./auth";

function authHeaders() {
  const auth = getAuth();
  return auth?.access_token ? { Authorization: `Bearer ${auth.access_token}` } : {};
}

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Lỗi HTTP ${res.status}`);
  }
  return res.json();
}

// Khách hàng tự đổi điểm của chính mình (không gửi customer_id — backend tự
// lấy từ token). Nhân viên/admin đổi hộ khách tại quầy thì truyền customerId.
export function redeemVoucher(points, customerId) {
  return fetch(`${API_BASE}/vouchers/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      points: Number(points),
      ...(customerId ? { customer_id: Number(customerId) } : {}),
    }),
  }).then(handle);
}

// Voucher của chính khách hàng đang đăng nhập.
export function myVouchers() {
  return fetch(`${API_BASE}/vouchers/mine`, { headers: { ...authHeaders() } }).then(handle);
}

// Nhân viên/admin tra voucher của 1 khách cụ thể (đối soát tại quầy).
export function vouchersOfCustomer(customerId) {
  return fetch(`${API_BASE}/vouchers?customer_id=${Number(customerId)}`, {
    headers: { ...authHeaders() },
  }).then(handle);
}
