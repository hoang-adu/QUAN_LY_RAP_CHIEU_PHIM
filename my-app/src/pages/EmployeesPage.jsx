// src/pages/EmployeesPage.jsx
// Trang này chỉ Admin truy cập được (route-guard AdminRoute trong App.js),
// nên mọi thao tác Thêm/Sửa/Xóa nhân viên đều cho phép ở đây.
import React from "react";
import useApiList from "../api/useApiList";
import CrudSection from "../components/CrudSection";
import "./table.css";

const POSITION_OPTIONS = [
  { value: "Nhân viên", label: "Nhân viên" },
  { value: "Thu ngân", label: "Thu ngân" },
  { value: "Bảo vệ", label: "Bảo vệ" },
  { value: "Quản lý", label: "Quản lý" },
  { value: "Admin", label: "Admin" },
];

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "admin", label: "Admin" },
];

const FIELDS = [
  { name: "full_name", label: "Họ tên", required: true },
  { name: "phone", label: "Số điện thoại" },
  { name: "email", label: "Email", required: true, type: "email" },
  {
    name: "password",
    label: "Mật khẩu",
    type: "password",
    required: (isEdit) => !isEdit,
  },
  { name: "position", label: "Chức vụ", type: "select", options: POSITION_OPTIONS },
  { name: "role", label: "Quyền đăng nhập", type: "select", options: ROLE_OPTIONS, required: true },
];

function roleBadge(role) {
  return (
    <span className={"et-badge " + (role === "admin" ? "ok" : "pending")}>
      {role === "admin" ? "Admin" : "Employee"}
    </span>
  );
}

export default function EmployeesPage() {
  const { rows, loading, error, reload } = useApiList("employees");

  return (
    <CrudSection
      title="Nhân viên"
      subtitle="Dữ liệu thật từ API /employees — chỉ Admin có quyền truy cập trang này"
      apiPath="employees"
      idKey="employee_id"
      rows={rows}
      loading={loading}
      error={error}
      reload={reload}
      fields={FIELDS}
      toDto={(v, isEdit) => {
        const dto = { ...v };
        if (isEdit && !dto.password) delete dto.password;
        return dto;
      }}
      columns={[
        { key: "employee_id", label: "Mã NV" },
        { key: "full_name", label: "Họ tên" },
        { key: "phone", label: "Số điện thoại" },
        { key: "email", label: "Email" },
        { key: "position", label: "Chức vụ" },
        { key: "role", label: "Quyền", render: roleBadge },
      ]}
    />
  );
}
