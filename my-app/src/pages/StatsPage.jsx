
import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import useApiList from "../api/useApiList";
import useApiGet from "../api/useApiGet";
import "./table.css";
import "../components/ui.css";

function fmtVND(n) {
  return (n || 0).toLocaleString("vi-VN") + " đ";
}

// Nhãn hiển thị "d/m" từ key "YYYY-MM-DD" — tách chuỗi trực tiếp, KHÔNG đi
// qua Date/toISOString, để tránh lệch ngày do timezone trình duyệt.
function labelFromKey(key) {
  const [, m, d] = key.split("-");
  return `${Number(d)}/${Number(m)}`;
}

export default function StatsPage() {
  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 13);

  const [fromDate, setFromDate] = useState(twoWeeksAgo.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(today.toISOString().slice(0, 10));

  // Gọi thẳng các endpoint tổng hợp ở backend (SUM/GROUP BY chạy trong SQL)
  // thay vì tải nguyên bảng payments/bookings/tickets/showtimes/movies về
  // trình duyệt rồi tự cộng bằng tay — nhanh hơn và không phải tải lại toàn
  // bộ lịch sử giao dịch mỗi lần mở trang.
  const overview = useApiGet(`stats/overview?from=${fromDate}&to=${toDate}`);
  const revenueDaily = useApiList(`stats/revenue-by-day?from=${fromDate}&to=${toDate}`);
  const topMoviesData = useApiList(`stats/top-movies?limit=5`);

  const loading = overview.loading || revenueDaily.loading || topMoviesData.loading;
  const loadError = overview.error || revenueDaily.error || topMoviesData.error;

  const totalRevenue = overview.data?.totalRevenue || 0;
  const bookingStatusCounts = overview.data?.bookingStatusCounts || {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  };

  // revenueDaily.rows đã là đủ cả khoảng ngày đã chọn (kể cả ngày không có
  // doanh thu = 0) — dùng thẳng để xuất Excel; biểu đồ chỉ hiện tối đa 14
  // cột gần nhất cho gọn.
  const revenueByDayFull = revenueDaily.rows;
  const revenueByDay = useMemo(
    () => revenueByDayFull.slice(-14).map((d) => ({ ...d, label: labelFromKey(d.key) })),
    [revenueByDayFull],
  );
  const maxDay = Math.max(1, ...revenueByDay.map((d) => d.value));

  const topMovies = topMoviesData.rows;
  const maxTicketCount = Math.max(1, ...topMovies.map((m) => m.count));

  function handleExportExcel() {
    const workbook = XLSX.utils.book_new();

    const overviewSheet = XLSX.utils.json_to_sheet([
      { "Chỉ số": "Từ ngày", "Giá trị": fromDate },
      { "Chỉ số": "Đến ngày", "Giá trị": toDate },
      { "Chỉ số": "Doanh thu đã thu", "Giá trị": totalRevenue },
      { "Chỉ số": "Đơn đã xác nhận", "Giá trị": bookingStatusCounts.confirmed },
      { "Chỉ số": "Đơn chờ xử lý", "Giá trị": bookingStatusCounts.pending },
      { "Chỉ số": "Đơn đã hủy", "Giá trị": bookingStatusCounts.cancelled },
    ]);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, "Tong quan");

    const revenueSheet = XLSX.utils.json_to_sheet(
      revenueByDayFull.map((d) => ({ "Ngày": d.key, "Doanh thu (đ)": d.value })),
    );
    XLSX.utils.book_append_sheet(workbook, revenueSheet, "Doanh thu theo ngay");

    const topMoviesSheet = XLSX.utils.json_to_sheet(
      topMovies.map((m, idx) => ({
        "Hạng": idx + 1,
        "Phim": m.name,
        "Số vé bán ra": m.count,
      })),
    );
    XLSX.utils.book_append_sheet(workbook, topMoviesSheet, "Top phim");

    XLSX.writeFile(workbook, `thong-ke_${fromDate}_den_${toDate}.xlsx`);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Thống kê</div>
          <div className="page-sub">
            Doanh thu, số vé bán ra
          </div>
        </div>
        <button
          type="button"
          className="ui-btn ui-btn-primary"
          onClick={handleExportExcel}
          disabled={loading}
        >
          📊 Xuất Excel
        </button>
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

      {loadError ? (
        <div className="et-status">Không thể tải dữ liệu thống kê: {loadError}</div>
      ) : loading ? (
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
                <div className="hbar-row" key={m.movie_id ?? m.name}>
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
