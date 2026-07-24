// src/pages/PaymentsPage.jsx
import React from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import "./table.css";

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const cls = s === "success" || s === "paid" ? "ok" : s === "failed" ? "cancel" : "pending";
  return <span className={"et-badge " + cls}>{status || "—"}</span>;
}

export default function PaymentsPage() {
  const { rows, loading, error } = useApiList("payments");

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Thanh toán</div>
        </div>
      </div>

      <DataTable
        rows={rows}
        loading={loading}
        error={error}
        columns={[
          { key: "payment_id", label: "Mã thanh toán" },
          { key: "booking_id", label: "Đơn đặt vé (ID)" },
          { key: "payment_date", label: "Ngày thanh toán" },
          { key: "amount", label: "Số tiền" },
          { key: "payment_method", label: "Phương thức" },
          { key: "payment_status", label: "Trạng thái", render: statusBadge },
        ]}
      />
    </>
  );
}
