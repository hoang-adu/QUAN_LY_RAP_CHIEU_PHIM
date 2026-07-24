// src/api/moviesApi.js
// Gọi trực tiếp các API thật của backend NestJS (xem Câu 4 — MoviesController)
// Đảm bảo backend đang chạy ở http://localhost:3000 (npm run start:dev trong thư mục quan-ly-rap-chieu-phim)

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Lỗi HTTP ${res.status}`);
  }
  return res.json();
}

// GET /movies — lấy danh sách tất cả phim
export function getMovies() {
  return fetch(`${API_BASE}/movies`).then(handleResponse);
}

// GET /movies/:id — lấy chi tiết 1 phim
export function getMovie(id) {
  return fetch(`${API_BASE}/movies/${id}`).then(handleResponse);
}

// POST /movies — thêm phim mới
export function createMovie(dto) {
  return fetch(`${API_BASE}/movies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }).then(handleResponse);
}

// PATCH /movies/:id — cập nhật phim
export function updateMovie(id, dto) {
  return fetch(`${API_BASE}/movies/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }).then(handleResponse);
}

// DELETE /movies/:id — xóa phim
export function deleteMovie(id) {
  return fetch(`${API_BASE}/movies/${id}`, { method: "DELETE" }).then(
    handleResponse,
  );
}
