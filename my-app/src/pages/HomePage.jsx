// src/pages/HomePage.jsx
// Trang chủ — bố cục phỏng theo layout Phenikaa bạn gửi (thanh bộ lọc + tab
// danh mục + lưới thẻ card), nhưng nội dung là DỮ LIỆU THẬT của dự án (phim
// đang/sắp chiếu) thay vì tin tức, để đúng nguyên tắc quản lý của nhóm:
// Trang chủ vẫn phải phản ánh đúng số liệu vận hành rạp, không phải nội
// dung biên tập tự do.
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getList, resolveAssetUrl } from "../api/apiClient";
import { isAdmin } from "../api/auth";
import { formatDate, movieStatus, splitList } from "./MoviesPage";
import "./table.css";
import "./HomePage.css";

// Thẻ số liệu nhanh — giữ lại tinh thần bản Trang chủ cũ (đếm số bản ghi
// từng bảng), chỉ thu gọn thành dải chip để nhường không gian chính cho
// lưới phim, đúng như layout tham khảo.
const STAT_SOURCES = [
  { key: "movies", label: "Phim", icon: "🎞️", to: "/movies" },
  { key: "rooms", label: "Phòng chiếu", icon: "🏛️", to: "/rooms" },
  { key: "showtimes", label: "Suất chiếu", icon: "🕒", to: "/showtimes" },
  { key: "bookings", label: "Đơn đặt vé", icon: "🎟️", to: "/bookings" },
  { key: "customers", label: "Khách hàng", icon: "👤", to: "/customers" },
  { key: "employees", label: "Nhân viên", icon: "🧑‍💼", to: "/employees", adminOnly: true },
];

const TABS = [
  { key: "all", label: "Toàn bộ" },
  { key: "showing", label: "Đang chiếu" },
  { key: "upcoming", label: "Sắp chiếu" },
];

function CardPoster({ src, alt, status }) {
  const [broken, setBroken] = useState(false);
  const resolved = src ? resolveAssetUrl(src) : null;
  return (
    <div className="home-card__media">
      {status && (
        <span className={`home-card__badge home-card__badge--${status.cls}`}>
          {status.label}
        </span>
      )}
      {resolved && !broken ? (
        <img src={resolved} alt={alt} onError={() => setBroken(true)} />
      ) : (
        <span className="home-card__media-icon">🎬</span>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const admin = isAdmin();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({});

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tab, setTab] = useState("all");
  const [genre, setGenre] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

  // Danh sách thể loại để chọn trong dropdown — tự suy ra từ dữ liệu phim
  // thật (tách chuỗi "Hành động, Viễn tưởng" thành từng thể loại riêng),
  // khách không cần biết gõ đúng tên thể loại bằng tiếng Anh/Việt.
  const genreOptions = useMemo(() => {
    const set = new Set();
    movies.forEach((m) => splitList(m.genre).forEach((g) => set.add(g)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [movies]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getList("movies"),
      ...STAT_SOURCES.map((s) =>
        getList(s.key)
          .then((data) => [s.key, Array.isArray(data) ? data.length : 0])
          .catch(() => [s.key, null]),
      ),
    ])
      .then(([movieList, ...entries]) => {
        if (!mounted) return;
        setMovies(Array.isArray(movieList) ? movieList : []);
        const obj = {};
        entries.forEach(([k, v]) => (obj[k] = v));
        setCounts(obj);
      })
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  // Đếm sẵn theo từng tab để hiện số bên cạnh tên tab, giống kiểu Phenikaa
  // đếm số tin theo từng phòng ban.
  const tabCounts = useMemo(() => {
    const c = { all: movies.length, showing: 0, upcoming: 0 };
    movies.forEach((m) => {
      const st = movieStatus(m.release_date);
      if (st.cls === "showing") c.showing += 1;
      else c.upcoming += 1;
    });
    return c;
  }, [movies]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movies
      .filter((m) => {
        if (!q) return true;
        return (
          m.title?.toLowerCase().includes(q) ||
          m.director?.toLowerCase().includes(q) ||
          m.genre?.toLowerCase().includes(q)
        );
      })
      .filter((m) => {
        if (tab === "all") return true;
        return movieStatus(m.release_date).cls === tab;
      })
      .filter((m) => {
        if (!fromDate && !toDate) return true;
        if (!m.release_date) return false;
        if (fromDate && m.release_date < fromDate) return false;
        if (toDate && m.release_date > toDate) return false;
        return true;
      })
      .filter((m) => {
        if (!genre) return true;
        return splitList(m.genre).includes(genre);
      })
      .sort((a, b) => {
        const cmp = (a.release_date || "").localeCompare(b.release_date || "");
        return sortOrder === "oldest" ? cmp : -cmp;
      });
  }, [movies, search, tab, fromDate, toDate, genre, sortOrder]);

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setTab("all");
    setGenre("");
    setSortOrder("newest");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Trang chủ</div>
          <div className="page-sub">Tổng quan phim đang &amp; sắp chiếu tại rạp</div>
        </div>
      </div>

      {/* Dải số liệu nhanh */}
      <div className="home-quickstats">
        {STAT_SOURCES.map((s) => {
          const locked = s.adminOnly && !admin;
          return (
            <div
              key={s.key}
              className={"home-chip" + (locked ? " home-chip--locked" : "")}
              role="button"
              tabIndex={locked ? -1 : 0}
              title={locked ? "Bạn không có quyền truy cập mục này" : `Xem ${s.label}`}
              onClick={() => !locked && navigate(s.to)}
              onKeyDown={(e) => {
                if (!locked && (e.key === "Enter" || e.key === " ")) navigate(s.to);
              }}
            >
              <span>{s.icon}</span>
              <b>{counts[s.key] === null ? "—" : counts[s.key] ?? "…"}</b>
              <span>{s.label}{locked ? " 🔒" : ""}</span>
            </div>
          );
        })}
      </div>

      {/* Thanh bộ lọc */}
      <div className="home-filterbar">
        <div className="home-filterbar__search">
          <span>🔍</span>
          <input
            placeholder="Tìm phim theo tên, đạo diễn, thể loại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="home-filterbar__date">
          <span>Từ ngày</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="home-filterbar__date">
          <span>Đến ngày</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="home-filterbar__select">
          <span>Thể loại</span>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Tất cả thể loại</option>
            {genreOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="home-filterbar__select">
          <span>Sắp xếp</span>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
        <button className="home-filterbar__clear" onClick={clearFilters}>
          Xóa lọc
        </button>
      </div>

      {/* Tabs danh mục */}
      <div className="home-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={"home-tab" + (tab === t.key ? " home-tab--active" : "")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className="home-tab__count">({tabCounts[t.key] ?? 0})</span>
          </button>
        ))}
      </div>

      {loading && <div className="et-status">Đang tải dữ liệu phim...</div>}
      {error && (
        <div className="et-status et-error">
          Không thể kết nối tới API: {error}. Kiểm tra backend đã chạy ở
          http://localhost:3000 và đã bật CORS chưa.
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="home-empty">Không có phim nào khớp với bộ lọc hiện tại.</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="home-grid">
          {filtered.map((m) => {
            const status = movieStatus(m.release_date);
            return (
              <div className="home-card" key={m.movie_id}>
                <CardPoster src={m.poster} alt={m.title} status={status} />
                <div className="home-card__body">
                  <div className="home-card__title">{m.title}</div>
                  <div className="home-card__meta">
                    🎬 {m.genre || "Chưa phân loại"}
                  </div>
                  <div className="home-card__meta">
                    📅 {formatDate(m.release_date)}
                  </div>
                  <div className="home-card__footer">
                    <button
                      className="home-card__link"
                      onClick={() => navigate("/movies")}
                    >
                      Xem chi tiết ›
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}