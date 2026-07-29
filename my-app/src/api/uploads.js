// src/api/uploads.js
// Upload ảnh từ máy lên backend (POST /uploads/image?folder=...), trả về
// đường dẫn tương đối để lưu vào cột poster/image trong DB. Dùng chung cho
// mọi nơi cần "vừa dán URL, vừa tải ảnh từ máy" (xem ImageField.jsx).
import { API_BASE } from "./apiClient";
import { getAuth, clearAuth } from "./auth";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // khớp với giới hạn backend
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadImage(file, folder = "misc") {
  const auth = getAuth();
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/uploads/image?folder=${encodeURIComponent(folder)}`, {
    method: "POST",
    // KHÔNG tự set Content-Type: để trình duyệt tự thêm boundary đúng cho
    // multipart/form-data — set tay sẽ làm hỏng request.
    headers: auth?.access_token ? { Authorization: `Bearer ${auth.access_token}` } : {},
    body: form,
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Tải ảnh lên thất bại (lỗi ${res.status}).`);
  }
  return res.json(); // { url, originalName, size }
}