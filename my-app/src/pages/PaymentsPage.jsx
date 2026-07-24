// src/pages/PaymentsPage.jsx
import React, { useState } from "react";
import useApiList from "../api/useApiList";
import { createItem, updateItem, removeItem } from "../api/apiClient";
import DataTable from "./DataTable";
import FormModal from "./FormModal";
import "./table.css";

const PAYMENT_FIELDS = [
  { key: "booking_id", label: "Đơn đặt vé (ID)", type: "number", required: true },
  { key: "amount", label: "Số tiền", type: "number" },
  {
    key: "payment_method",
    label: "Phương thức",
    type: "select",
    options: [
      { value: "cash", label: "Tiền mặt" },
      { value: "momo", label: "MoMo" },
      { value: "banking", label: "Chuyển khoản" },
      { value: "card", label: "Thẻ" },
    ],
  },
  {
    key: "payment_status",
    label: "Trạng thái",
    type: "select",
    options: [
      { value: "pending", label: "Chờ xử lý" },
      { value: "success", label: "Thành công" },
      { value: "failed", label: "Thất bại" },
    ],
  },
];

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const cls = s === "success" || s === "paid" ? "ok" : s === "failed" ? "cancel" : "pending";
  return <span className={"et-badge " + cls}>{status || "—"}</span>;
}

export default function PaymentsPage() {
  const { rows, loading, error, reload } = useApiList("payments");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSubmit = async (payload) => {
    if (editing) await updateItem("payments", editing.payment_id, payload);
    else await createItem("payments", payload);
    reload();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa thanh toán #${row.payment_id}?`)) return;
    try {
      await removeItem("payments", row.payment_id);
      reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Thanh toán</div>
        </div>
        <button
          className="page-btn-add"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Thêm thanh toán
        </button>
      </div>

      <DataTable
        rows={rows}
        loading={loading}
        error={error}
        rowKey="payment_id"
        columns={[
          { key: "payment_id", label: "Mã thanh toán" },
          { key: "booking_id", label: "Đơn đặt vé (ID)" },
          { key: "payment_date", label: "Ngày thanh toán" },
          { key: "amount", label: "Số tiền" },
          { key: "payment_method", label: "Phương thức" },
          { key: "payment_status", label: "Trạng thái", render: statusBadge },
        ]}
        onEdit={(row) => {
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      <FormModal
        open={modalOpen}
        title={editing ? "Sửa thanh toán" : "Thêm thanh toán"}
        fields={PAYMENT_FIELDS}
        initialValues={editing}
        submitLabel={editing ? "Lưu thay đổi" : "Thêm thanh toán"}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
