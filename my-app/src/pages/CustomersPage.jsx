// src/pages/CustomersPage.jsx
import React, { useState } from "react";
import useApiList from "../api/useApiList";
import { createItem, updateItem, removeItem } from "../api/apiClient";
import DataTable from "./DataTable";
import FormModal from "./FormModal";
import "./table.css";

const CUSTOMER_FIELDS = [
  { key: "full_name", label: "Họ tên" },
  { key: "phone", label: "Số điện thoại" },
  { key: "email", label: "Email", type: "email" },
  { key: "password", label: "Mật khẩu", type: "password", placeholder: "Để trống nếu không đổi" },
  { key: "points", label: "Điểm tích lũy", type: "number" },
];

export default function CustomersPage() {
  const { rows, loading, error, reload } = useApiList("customers");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSubmit = async (payload) => {
    if (editing) await updateItem("customers", editing.customer_id, payload);
    else await createItem("customers", payload);
    reload();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa khách hàng "${row.full_name || row.customer_id}"?`)) return;
    try {
      await removeItem("customers", row.customer_id);
      reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Khách hàng</div>
          <div className="page-sub">Tổng quan</div>
        </div>
        <button
          className="page-btn-add"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Thêm khách hàng
        </button>
      </div>

      <DataTable
        rows={rows}
        loading={loading}
        error={error}
        rowKey="customer_id"
        columns={[
          { key: "customer_id", label: "Mã KH" },
          { key: "full_name", label: "Họ tên" },
          { key: "phone", label: "Số điện thoại" },
          { key: "email", label: "Email" },
          { key: "points", label: "Điểm tích lũy" },
        ]}
        onEdit={(row) => {
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      <FormModal
        open={modalOpen}
        title={editing ? "Sửa khách hàng" : "Thêm khách hàng"}
        fields={CUSTOMER_FIELDS}
        initialValues={editing ? { ...editing, password: "" } : editing}
        submitLabel={editing ? "Lưu thay đổi" : "Thêm khách hàng"}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
