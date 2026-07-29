// src/pages/MoviesPage.jsx
// Quản lý Phim — đầy đủ Xem / Thêm / Sửa / Xóa, dữ liệu thật từ API /movies.
import React, { useMemo } from "react";
import useApiList from "../api/useApiList";
import CrudSection from "../components/CrudSection";
import { resolveAssetUrl } from "../api/apiClient";
import "./table.css";
import "./MoviesPage.css";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

function formatDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// "121" phút -> "2h 1p" — dễ đọc hơn số phút thô, giống cách các rạp thật hiển thị.
function formatDuration(mins) {
  const m = Number(mins);
  if (!m || m <= 0) return null;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} phút`;
  if (rest === 0) return `${h} giờ`;
  return `${h} giờ ${rest} phút`;
}

// Tách chuỗi "A, B, C" thành từng phần tử (dùng cho thể loại / diễn viên) —
// chấp nhận cả dấu phẩy lẫn dấu chấm phẩy, bỏ khoảng trắng thừa.
function splitList(text) {
  if (!text) return [];
  return text
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// So ngày phát hành với hôm nay -> phim đang chiếu hay sắp chiếu. Đây chỉ là
// suy luận hiển thị (không có cột "status" riêng trong DB) nên khi thiếu
// release_date thì mặc định coi là đang chiếu.
function movieStatus(releaseDate) {
  if (!releaseDate) return { label: "Đang chiếu", cls: "showing" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(releaseDate);
  if (Number.isNaN(d.getTime())) return { label: "Đang chiếu", cls: "showing" };
  return d > today ? { label: "Sắp chiếu", cls: "upcoming" } : { label: "Đang chiếu", cls: "showing" };
}

// Ảnh poster có thể trống hoặc URL bị lỗi (link hỏng, sai tên file...) —
// khi đó ẩn thẻ <img> đi và hiện icon thay thế để không hiển thị ô ảnh vỡ.
function PosterThumb({ src, alt, large }) {
  const [broken, setBroken] = React.useState(false);
  const cls = "movie-thumb" + (large ? " movie-thumb--lg" : "");
  const resolvedSrc = src ? resolveAssetUrl(src) : null;
  if (!resolvedSrc || broken) {
    return <div className={cls + " movie-thumb--empty"}>🎬</div>;
  }
  return (
    <img
      className={cls}
      src={resolvedSrc}
      alt={alt}
      onError={() => setBroken(true)}
    />
  );
}

// Danh sách suất chiếu sắp tới của 1 phim (dữ liệu thật từ /showtimes +
// /rooms) — gộp vào modal chi tiết để nhân viên xem luôn phim này đang/sẽ
// chiếu ở phòng nào, ngày giờ nào mà không phải mở thêm trang Suất chiếu.
function UpcomingShowtimes({ movieId, showtimes, rooms }) {
  const roomById = useMemo(
    () => Object.fromEntries(rooms.map((r) => [String(r.room_id), r])),
    [rooms],
  );

  const upcoming = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return showtimes
      .filter((s) => String(s.movie_id) === String(movieId))
      .filter((s) => !s.show_date || s.show_date >= todayStr)
      .sort((a, b) => {
        const da = `${a.show_date} ${a.start_time}`;
        const db = `${b.show_date} ${b.start_time}`;
        return da.localeCompare(db);
      });
  }, [showtimes, movieId, /* todayStr tính lại mỗi render nhưng đủ nhẹ */]);

  if (upcoming.length === 0) {
    return (
      <div className="movie-detail__showtimes-empty">
        Chưa có suất chiếu nào sắp tới cho phim này.
      </div>
    );
  }

  const MAX_SHOWN = 8;
  const shown = upcoming.slice(0, MAX_SHOWN);
  const remaining = upcoming.length - shown.length;

  return (
    <div className="movie-detail__showtimes-list">
      {shown.map((s) => (
        <div className="st-chip" key={s.showtime_id}>
          <span className="st-chip__date">{formatDateShort(s.show_date)}</span>
          <span className="st-chip__time">{s.start_time?.slice(0, 5) || "—"}</span>
          <span className="st-chip__room">
            {roomById[String(s.room_id)]?.room_name || `Phòng #${s.room_id}`}
          </span>
        </div>
      ))}
      {remaining > 0 && (
        <div className="st-chip st-chip--more">+{remaining} suất khác</div>
      )}
    </div>
  );
}

// Nội dung modal "Xem" — giới thiệu đầy đủ về phim (chỉ xem, không sửa).
function MovieDetail({ row, showtimes, rooms }) {
  const posterSrc = row.poster ? resolveAssetUrl(row.poster) : null;
  const status = movieStatus(row.release_date);
  const genres = splitList(row.genre);
  const actorList = splitList(row.actors);
  const durationLabel = formatDuration(row.duration);

  return (
    <div className="movie-detail">
      {/* Backdrop mờ từ chính poster — cho cảm giác "trang phim" thật thay vì
          1 khối trắng trơn với vài dòng chữ. */}
      <div
        className="movie-detail__hero"
        style={posterSrc ? { backgroundImage: `url(${posterSrc})` } : undefined}
      >
        <div className="movie-detail__hero-overlay" />
        <div className="movie-detail__hero-content">
          <PosterThumb src={row.poster} alt={row.title} large />
          <div className="movie-detail__top-info">
            <span className={`movie-detail__status movie-detail__status--${status.cls}`}>
              ● {status.label}
            </span>
            <div className="movie-detail__title">{row.title}</div>
            <div className="movie-detail__badges">
              {genres.length > 0
                ? genres.map((g) => (
                    <span className="movie-detail__tag" key={g}>{g}</span>
                  ))
                : <span className="movie-detail__tag movie-detail__tag--muted">Chưa phân loại</span>}
              {durationLabel && <span className="movie-detail__tag movie-detail__tag--outline">⏱ {durationLabel}</span>}
              <span className="movie-detail__tag movie-detail__tag--outline">📅 {formatDate(row.release_date)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="movie-detail__stats">
        <div className="movie-detail__stat">
          <span className="movie-detail__stat-icon">🎬</span>
          <div>
            <div className="movie-detail__stat-label">Đạo diễn</div>
            <div className="movie-detail__stat-value">{row.director || "Chưa cập nhật"}</div>
          </div>
        </div>
        <div className="movie-detail__stat">
          <span className="movie-detail__stat-icon">⏱</span>
          <div>
            <div className="movie-detail__stat-label">Thời lượng</div>
            <div className="movie-detail__stat-value">{durationLabel || "Chưa cập nhật"}</div>
          </div>
        </div>
        <div className="movie-detail__stat">
          <span className="movie-detail__stat-icon">📅</span>
          <div>
            <div className="movie-detail__stat-label">Khởi chiếu</div>
            <div className="movie-detail__stat-value">{formatDate(row.release_date)}</div>
          </div>
        </div>
      </div>

      {actorList.length > 0 && (
        <div className="movie-detail__section">
          <div className="movie-detail__section-label">🎭 Diễn viên</div>
          <div className="movie-detail__chip-row">
            {actorList.map((a) => (
              <span className="movie-detail__chip" key={a}>{a}</span>
            ))}
          </div>
        </div>
      )}

      <div className="movie-detail__section">
        <div className="movie-detail__section-label">📝 Giới thiệu phim</div>
        {row.description ? (
          <p className="movie-detail__desc">{row.description}</p>
        ) : (
          <p className="movie-detail__desc movie-detail__desc--empty">
            Phim này chưa có mô tả — bấm "Sửa" để bổ sung nội dung giới thiệu.
          </p>
        )}
      </div>

      <div className="movie-detail__section">
        <div className="movie-detail__section-label">🕒 Suất chiếu sắp tới</div>
        <UpcomingShowtimes movieId={row.movie_id} showtimes={showtimes} rooms={rooms} />
      </div>
    </div>
  );
}

const FIELDS = [
  { name: "title", label: "Tên phim", required: true, fullWidth: true },
  { name: "genre", label: "Thể loại", placeholder: "VD: Hành động, Viễn tưởng..." },
  { name: "duration", label: "Thời lượng (phút)", type: "number" },
  { name: "director", label: "Đạo diễn" },
  { name: "release_date", label: "Ngày khởi chiếu", type: "date" },
  {
    name: "poster",
    label: "Ảnh poster",
    type: "image",
    folder: "movies",
    fullWidth: true,
    placeholder: "Dán URL ảnh (https://...) hoặc bấm Tải ảnh lên",
  },
  { name: "actors", label: "Diễn viên", type: "textarea", fullWidth: true },
  { name: "description", label: "Mô tả", type: "textarea", fullWidth: true },
];

export default function MoviesPage() {
  const { rows, loading, error, reload } = useApiList("movies");
  const showtimes = useApiList("showtimes");
  const rooms = useApiList("rooms");

  return (
    <CrudSection
      title="Quản lý Phim"
      subtitle="Dữ liệu thật từ API /movies"
      apiPath="movies"
      idKey="movie_id"
      rows={rows}
      loading={loading}
      error={error}
      reload={reload}
      fields={FIELDS}
      renderDetail={(row) => (
        <MovieDetail row={row} showtimes={showtimes.rows} rooms={rooms.rows} />
      )}
      detailTitle={() => "Thông tin phim"}
      toDto={(v) => ({
        ...v,
        duration: v.duration === "" ? null : Number(v.duration),
      })}
      columns={[
        { key: "movie_id", label: "Mã phim" },
        {
          key: "poster",
          label: "Ảnh",
          render: (v, row) => <PosterThumb src={v} alt={row.title} />,
        },
        { key: "title", label: "Tên phim" },
        { key: "genre", label: "Thể loại" },
        { key: "duration", label: "Thời lượng", render: (v) => formatDuration(v) || "—" },
        { key: "director", label: "Đạo diễn" },
        { key: "release_date", label: "Khởi chiếu", render: formatDate },
      ]}
    />
  );
}