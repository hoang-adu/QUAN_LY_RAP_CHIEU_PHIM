
import React, { useState } from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import { updateItem } from "../api/apiClient";
import { useToast } from "../components/ToastContext";
import "./table.css";
import "../components/ui.css";

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const cls = s === "paid" ? "ok" : s === "failed" ? "cancel" : "pending";
  return <span className={"et-badge " + cls}>{status || "—"}</span>;
}

export default function PaymentsPage() {
  const { rows, loading, error, reload } = useApiList("payments");
  const bookings = useApiList("bookings");
  const customers = useApiList("customers");
  const toast = useToast();
  const [updatingId, setUpdatingId] = useState(null);

  const customerNameByBookingId = Object.fromEntries(
    bookings.rows.map((b) => {
      const customer = customers.rows.find(
        (c) => String(c.customer_id) === String(b.customer_id),
      );
      return [String(b.booking_id), customer?.full_name];
    }),
  );

  async function changeStatus(row, payment_status) {
    setUpdatingId(row.payment_id);
    try {
      await updateItem("payments", row.payment_id, { payment_status });
      toast.success(`Đã cập nhật thanh toán #${row.payment_id} -> ${payment_status}.`);
      reload();
    } catch (err) {
      toast.error(err.message || "Cập nhật thất bại.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Thanh toán</div>
          <div className="page-sub">Tổng quan</div>
        </div>
      </div>

      <DataTable
        rows={rows}
        loading={loading}
        error={error}
        columns={[
          { key: "payment_id", label: "Mã thanh toán" },
          { key: "booking_id", label: "Đơn đặt vé (ID)" },
          {
            key: "customer_name",
            label: "Khách hàng",
            render: (_v, row) => customerNameByBookingId[String(row.booking_id)] || "—",
          },
          { key: "payment_date", label: "Ngày thanh toán" },
          {
            key: "amount",
            label: "Số tiền",
            render: (v) => (v != null ? Number(v).toLocaleString("vi-VN") + " đ" : "—"),
          },
          { key: "payment_method", label: "Phương thức" },
          { key: "payment_status", label: "Trạng thái", render: statusBadge },
        ]}
        actions={(row) => (
          <>
            {row.payment_status !== "paid" && (
              <button
                className="ui-btn ui-btn-ghost ui-btn-sm"
                disabled={updatingId === row.payment_id}
                onClick={() => changeStatus(row, "paid")}
              >
                Đã thu tiền
              </button>
            )}
            {row.payment_status !== "failed" && (
              <button
                className="ui-btn ui-btn-danger ui-btn-sm"
                disabled={updatingId === row.payment_id}
                onClick={() => changeStatus(row, "failed")}
              >
                Đánh dấu lỗi
              </button>
            )}
          </>
        )}
      />
    </>
  );
}
