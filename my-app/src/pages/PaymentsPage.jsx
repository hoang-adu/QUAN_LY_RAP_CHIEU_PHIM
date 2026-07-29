import React, { useMemo, useState } from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import { updateItem } from "../api/apiClient";
import { useToast } from "../components/ToastContext";
import "./table.css";
import "../components/ui.css";

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const cls = s === "paid" ? "ok" : s === "failed" ? "cancel" : s === "refunded" ? "cancel" : "pending";
  return <span className={"et-badge " + cls}>{status === "refunded" ? "Đã hoàn (hủy đơn)" : status || "—"}</span>;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
}

function channelBadge(channel) {
  if (!channel) return <span className="page-sub">—</span>;
  return channel === "online" ? (
    <span className="et-badge pending">🌐 Online</span>
  ) : (
    <span className="et-badge ok">🏢 Tại quầy</span>
  );
}

export default function PaymentsPage() {
  const { rows, loading, error, reload } = useApiList("payments");
  const bookings = useApiList("bookings");
  const customers = useApiList("customers");
  const toast = useToast();
  const [updatingId, setUpdatingId] = useState(null);
  const [kw, setKw] = useState("");

  const customerNameByBookingId = Object.fromEntries(
    bookings.rows.map((b) => {
      const customer = customers.rows.find(
        (c) => String(c.customer_id) === String(b.customer_id),
      );
      return [String(b.booking_id), customer?.full_name];
    }),
  );

  // Tìm theo mã thanh toán, mã đơn, tên khách hàng hoặc phương thức thanh
  // toán — gõ mã đơn là ra ngay giao dịch liên quan, không cần dò tay.
  const filteredRows = useMemo(() => {
    const q = kw.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => {
      const customerName = (customerNameByBookingId[String(p.booking_id)] || "").toLowerCase();
      return (
        String(p.payment_id).includes(q) ||
        String(p.booking_id).includes(q) ||
        customerName.includes(q) ||
        (p.payment_method || "").toLowerCase().includes(q) ||
        (p.channel || "").toLowerCase().includes(q)
      );
    });
  }, [rows, kw, customerNameByBookingId]);

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

      <div className="ui-field" style={{ maxWidth: 380, marginBottom: 10 }}>
        <input
          placeholder="🔍 Tìm theo mã thanh toán, mã đơn, tên khách hoặc phương thức..."
          value={kw}
          onChange={(e) => setKw(e.target.value)}
        />
      </div>

      <DataTable
        rows={filteredRows}
        loading={loading}
        error={error}
        emptyText={kw ? "Không tìm thấy giao dịch nào khớp." : undefined}
        columns={[
          { key: "payment_id", label: "Mã thanh toán" },
          { key: "booking_id", label: "Đơn đặt vé (ID)" },
          {
            key: "customer_name",
            label: "Khách hàng",
            render: (_v, row) => customerNameByBookingId[String(row.booking_id)] || "—",
          },
          { key: "payment_date", label: "Ngày thanh toán", render: formatDateTime },
          {
            key: "amount",
            label: "Số tiền",
            render: (v) => (v != null ? Number(v).toLocaleString("vi-VN") + " đ" : "—"),
          },
          { key: "payment_method", label: "Phương thức" },
          { key: "channel", label: "Kênh", render: channelBadge },
          { key: "payment_status", label: "Trạng thái", render: statusBadge },
        ]}
        actions={(row) => {
          // Thanh toán ONLINE đã 'paid' bị khóa hoàn toàn — không hoàn tiền,
          // không sửa trạng thái (backend cũng chặn ở PaymentsService, đây
          // chỉ là ẩn nút cho gọn UI, tránh nhân viên bấm rồi mới thấy lỗi).
          const locked = row.channel === "online" && row.payment_status === "paid";
          if (locked) {
            return <span className="page-sub">🔒 Đã khóa (không hoàn tiền)</span>;
          }
          // Payment đã 'refunded' nghĩa là đơn gắn với nó đã bị hủy — không
          // còn thao tác nào hợp lý ngoài xem lại lịch sử.
          if (row.payment_status === "refunded") {
            return <span className="page-sub">Đơn đã hủy — đã hoàn</span>;
          }
          return (
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
          );
        }}
      />
    </>
  );
}