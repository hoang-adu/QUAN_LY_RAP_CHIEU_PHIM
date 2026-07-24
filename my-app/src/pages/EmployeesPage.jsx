// src/pages/EmployeesPage.jsx
import React from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import "./table.css";

export default function EmployeesPage() {
  const { rows, loading, error } = useApiList("employees");

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Nhân viên</div>
        </div>
      </div>

      <DataTable
        rows={rows}
        loading={loading}
        error={error}
        columns={[
          { key: "employee_id", label: "Mã NV" },
          { key: "full_name", label: "Họ tên" },
          { key: "phone", label: "Số điện thoại" },
          { key: "email", label: "Email" },
          { key: "position", label: "Chức vụ" },
        ]}
      />
    </>
  );
}
