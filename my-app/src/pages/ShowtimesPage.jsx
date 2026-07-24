// src/pages/ShowtimesPage.jsx
import React, { useState } from "react";
import useApiList from "../api/useApiList";
import { createItem, updateItem, removeItem } from "../api/apiClient";
import DataTable from "./DataTable";
import FormModal from "./FormModal";
import "./table.css";

const SHOWTIME_FIELDS = [
  { key: "movie_id", label: "Phim (ID)", type: "number", required: true },
  { key: "room_id", label: "Phòng (ID)", type: "number", required: true },
  { key: "show_date", label: "Ngày chiếu", type: "date" },
  { key: "start_time", label: "Giờ bắt đầu", type: "time" },
  { key: "end_time", label: "Giờ kết thúc", type: "time" },
];

export default function ShowtimesPage() {
  const { rows, loading, error, reload } = useApiList("showtimes");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSubmit = async (payload) => {
    if (editing) await updateItem("showtimes", editing.showtime_id, payload);
    else await createItem("showtimes", payload);
    reload();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa suất chiếu #${row.showtime_id}?`)) return;
    try {
      await removeItem("showtimes", row.showtime_id);
      reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Suất chiếu</div>
        </div>
        <button
          className="page-btn-add"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Thêm suất chiếu
        </button>
      </div>

      <DataTable
        rows={rows}
        loading={loading}
        error={error}
        rowKey="showtime_id"
        columns={[
          { key: "showtime_id", label: "Mã suất" },
          { key: "movie_id", label: "Phim (ID)" },
          { key: "room_id", label: "Phòng (ID)" },
          { key: "show_date", label: "Ngày chiếu" },
          { key: "start_time", label: "Giờ bắt đầu" },
          { key: "end_time", label: "Giờ kết thúc" },
        ]}
        onEdit={(row) => {
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      <FormModal
        open={modalOpen}
        title={editing ? "Sửa suất chiếu" : "Thêm suất chiếu"}
        fields={SHOWTIME_FIELDS}
        initialValues={editing}
        submitLabel={editing ? "Lưu thay đổi" : "Thêm suất chiếu"}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
