// src/pages/EmployeesPage.jsx
import React, { useState } from "react";
import useApiList from "../api/useApiList";
import { isAdmin } from "../api/auth";
import { createItem, updateItem, removeItem } from "../api/apiClient";
import DataTable from "./DataTable";
import FormModal from "./FormModal";
import "./table.css";

const EMPLOYEE_FIELDS = [
  { key: "full_name", label: "Họ tên" },
  { key: "phone", label: "Số điện thoại" },
  { key: "email", label: "Email", type: "email" },
  {
    key: "position",
    label: "Chức vụ",
    type: "select",
    options: [
      { value: "quản lý", label: "Quản lý" },
      { value: "thu ngân", label: "Thu ngân" },
      { value: "bảo vệ", label: "Bảo vệ" },
    ],
  },
];

export default function EmployeesPage() {
  const admin = isAdmin();
  const { rows, loading, error, reload } = useApiList("employees");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSubmit = async (payload) => {
    if (editing) await updateItem("employees", editing.employee_id, payload);
    else await createItem("employees", payload);
    reload();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa nhân viên "${row.full_name || row.employee_id}"?`)) return;
    try {
      await removeItem("employees", row.employee_id);
      reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Nhân viên</div>
          <div className="page-sub">Tổng quan</div>
        </div>
        {admin && (
          <button
            className="page-btn-add"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + Thêm nhân viên
          </button>
        )}
      </div>

      <DataTable
        rows={rows}
        loading={loading}
        error={error}
        rowKey="employee_id"
        columns={[
          { key: "employee_id", label: "Mã NV" },
          { key: "full_name", label: "Họ tên" },
          { key: "phone", label: "Số điện thoại" },
          { key: "email", label: "Email" },
          { key: "position", label: "Chức vụ" },
        ]}
        onEdit={
          admin
            ? (row) => {
                setEditing(row);
                setModalOpen(true);
              }
            : undefined
        }
        onDelete={admin ? handleDelete : undefined}
      />

      <FormModal
        open={modalOpen}
        title={editing ? "Sửa nhân viên" : "Thêm nhân viên"}
        fields={EMPLOYEE_FIELDS}
        initialValues={editing}
        submitLabel={editing ? "Lưu thay đổi" : "Thêm nhân viên"}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
