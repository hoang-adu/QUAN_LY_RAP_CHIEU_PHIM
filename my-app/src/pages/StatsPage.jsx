
import React, { useMemo, useState } from "react";
import useApiList from "../api/useApiList";
import "./table.css";
import "../components/ui.css";

function fmtVND(n) {
  return (n || 0).toLocaleString("vi-VN") + " đ";
}

function toDateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

export default function StatsPage() {
  const payments = useApiList("payments");
  const bookings = useApiList("bookings");
  const tickets = useApiList("tickets");
  const showtimes = useApiList("showtimes");
  const movies = useApiList("movies");

  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 13);

  const [fromDate, setFromDate] = useState(twoWeeksAgo.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(today.toISOString().slice(0, 10));

  const loading =
    payments.loading || bookings.loading || tickets.loading || showtimes.loading || movies.loading;

  const paidPayments = useMemo(
    () =>
      payments.rows.filter((p) => {
        if ((p.payment_status || "").toLowerCase() !== "paid") return false;
        const key = toDateKey(p.payment_date);
        return key >= fromDate && key <= toDate;
      }),
    [payments.rows, fromDate, toDate],
  );

  const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const bookingStatusCounts = useMemo(() => {
    const c = { pending: 0, confirmed: 0, cancelled: 0 };
    bookings.rows.forEach((b) => {
      const s = (b.status || "pending").toLowerCase();
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [bookings.rows]);

  // Doanh thu theo ngày trong khoảng đã chọn
  const revenueByDay = useMemo(() => {
    const map = {};
    paidPayments.forEach((p) => {
      const key = toDateKey(p.payment_date);
      map[key] = (map[key] || 0) + Number(p.amount || 0);
    });
    const days = [];
    const cur = new Date(fromDate);
    const end = new Date(toDate);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      days.push({ key, label: `${cur.getDate()}/${cur.getMonth() + 1}`, value: map[key] || 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return days.slice(-14); // tối đa 14 cột cho gọn
  }, [paidPayments, fromDate, toDate]);

  const maxDay = Math.max(1, ...revenueByDay.map((d) => d.value));

  // Top phim theo số vé bán ra
  const topMovies = useMemo(() => {
    const showtimeToMovie = Object.fromEntries(
      showtimes.rows.map((s) => [String(s.showtime_id), s.movie_id]),
    );
    const movieName = Object.fromEntries(movies.rows.map((m) => [String(m.movie_id), m.title]));
    const countByMovie = {};
    tickets.rows.forEach((t) => {
      const movieId = showtimeToMovie[String(t.showtime_id)];
      if (movieId == null) return;
      countByMovie[movieId] = (countByMovie[movieId] || 0) + 1;
    });
    return Object.entries(countByMovie)
      .map(([movieId, count]) => ({ name: movieName[movieId] || `#${movieId}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [tickets.rows, showtimes.rows, movies.rows]);

  const maxTicketCount = Math.max(1, ...topMovies.map((m) => m.count));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Thống kê</div>
          <div className="page-sub">
            Doanh thu, số vé bán ra 
          </div>
        </div>
      </div>

      <div className="stat-filter-row">
        <div className="ui-field">
          <label>Từ ngày</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="ui-field">
          <label>Đến ngày</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="et-status">Đang tải dữ liệu thống kê...</div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="num">{fmtVND(totalRevenue)}</div>
              <div className="label">💰 Doanh thu đã thu (khoảng đã chọn)</div>
            </div>
            <div className="stat-card">
              <div className="num">{bookingStatusCounts.confirmed}</div>
              <div className="label">✅ Đơn đã xác nhận</div>
            </div>
            <div className="stat-card">
              <div className="num">{bookingStatusCounts.pending}</div>
              <div className="label">⏳ Đơn chờ xử lý</div>
            </div>
            <div className="stat-card">
              <div className="num">{bookingStatusCounts.cancelled}</div>
              <div className="label">❌ Đơn đã hủy</div>
            </div>
          </div>

          <div className="section-title">Doanh thu theo ngày</div>
          {revenueByDay.length === 0 || totalRevenue === 0 ? (
            <div className="et-status">Chưa có doanh thu đã thu trong khoảng ngày này.</div>
          ) : (
            <div className="et-table-wrap" style={{ padding: "16px 20px" }}>
              <div className="bar-chart">
                {revenueByDay.map((d) => (
                  <div className="bar-col" key={d.key}>
                    {d.value > 0 && (
                      <div className="bar-value">{(d.value / 1000).toFixed(0)}k</div>
                    )}
                    <div
                      className="bar"
                      style={{ height: `${Math.max(2, (d.value / maxDay) * 130)}px` }}
                    />
                    <div className="bar-label">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="section-title">Top phim bán chạy (theo số vé)</div>
          {topMovies.length === 0 ? (
            <div className="et-status">Chưa có dữ liệu vé.</div>
          ) : (
            <div className="et-table-wrap" style={{ padding: "18px 20px" }}>
              {topMovies.map((m) => (
                <div className="hbar-row" key={m.name}>
                  <span>{m.name}</span>
                  <div className="hbar-track">
                    <div
                      className="hbar-fill"
                      style={{ width: `${(m.count / maxTicketCount) * 100}%` }}
                    />
                  </div>
                  <span>{m.count} vé</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
