// src/pages/DataTable.jsx
import React, { useEffect, useState } from "react";
import "./table.css";
import "../components/ui.css";

function renderValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

// Bảng dữ liệu dùng chung: nhận rows/columns thật từ API.
// Hỗ trợ thêm: phân trang phía client (pageSize) + cột "Thao tác" (actions).
export default function DataTable({
  rows,
  columns,
  loading,
  error,
  emptyText,
  pageSize = 10,
  actions, // (row) => ReactNode — nếu truyền vào sẽ thêm cột "Thao tác"
  onRowClick, // (row) => void — nếu truyền vào, cả dòng sẽ bấm được (VD: xem chi tiết)
}) {
  const [page, setPage] = useState(1);

  // Reset về trang 1 mỗi khi dữ liệu (số dòng) thay đổi, tránh kẹt ở trang trống
  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  if (loading) return <div className="et-status">Đang tải dữ liệu...</div>;
  if (error)
    return (
      <div className="et-status et-error">
        Không thể kết nối tới API: {error}. Kiểm tra backend đã chạy ở
        http://localhost:3000 và đã bật CORS chưa.
      </div>
    );
  if (!rows.length)
    return <div className="et-status">{emptyText || "Chưa có dữ liệu."}</div>;

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <div>
      <div className="et-table-wrap">
        <table className="et-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              {actions && <th style={{ width: 1 }}>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, idx) => (
              <tr
                key={row.id ?? start + idx}
                className={onRowClick ? "et-row-clickable" : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.render ? c.render(row[c.key], row) : renderValue(row[c.key])}
                  </td>
                ))}
                {actions && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="ui-row-actions">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="ui-pagination">
          <span>
            Trang {safePage}/{totalPages} · {rows.length} bản ghi
          </span>
          <div className="ui-pagination-btns">
            <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
              )
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={"dots" + i} style={{ padding: "0 4px" }}>
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={p === safePage ? "active" : ""}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}