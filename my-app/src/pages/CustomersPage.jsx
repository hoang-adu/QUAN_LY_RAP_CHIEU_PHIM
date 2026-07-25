// src/pages/CustomersPage.jsx
import React from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import "./table.css";

export default function CustomersPage() {
  const { rows, loading, error } = useApiList("customers");

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Khách hàng</div>
          <div className="page-sub">Tổng quan</div>
        </div>
      </div>

      <DataTable
        rows={rows}
        loading={loading}
        error={error}
        columns={[
          { key: "customer_id", label: "Mã KH" },
          { key: "full_name", label: "Họ tên" },
          { key: "phone", label: "Số điện thoại" },
          { key: "email", label: "Email" },
          { key: "points", label: "Điểm tích lũy" },
        ]}
      />
    </>
  );
}
