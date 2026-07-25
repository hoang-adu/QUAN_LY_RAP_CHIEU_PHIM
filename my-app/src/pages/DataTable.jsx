// src/pages/DataTable.jsx
import React from "react";
import "./table.css";

function renderValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

// Bảng dữ liệu dùng chung: nhận rows/columns thật từ API, không tự fetch.
// Truyền onEdit/onDelete để hiện thêm cột "Thao tác" (sửa/xóa gọi API thật).
export default function DataTable({
  rows,
  columns,
  loading,
  error,
  emptyText,
  onEdit,
  onDelete,
  rowKey = "id",
}) {
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

  const hasActions = onEdit || onDelete;

  return (
    <div className="et-table-wrap">
      <table className="et-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            {hasActions && <th className="et-actions-col">Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row[rowKey] ?? idx}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(row[c.key], row) : renderValue(row[c.key])}
                </td>
              ))}
              {hasActions && (
                <td className="et-actions-col">
                  <div className="et-actions">
                    {onEdit && (
                      <button
                        type="button"
                        className="et-btn-edit"
                        onClick={() => onEdit(row)}
                      >
                        Sửa
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="et-btn-delete"
                        onClick={() => onDelete(row)}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
