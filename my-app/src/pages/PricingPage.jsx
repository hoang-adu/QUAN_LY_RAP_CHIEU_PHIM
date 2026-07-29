// src/pages/PricingPage.jsx
// Trang quản lý GIÁ VÉ theo loại ghế (standard/vip/couple).
//
// NGUYÊN TẮC quan trọng cần hiểu khi đọc trang này:
//  - Đổi giá ở đây KHÔNG "sửa đè" giá cũ — mỗi lần bấm "Lưu giá mới" là
//    tạo thêm 1 dòng lịch sử mới (xem backend: TicketPricesService.create,
//    KHÔNG có API update/delete giá cũ).
//  - Giá mới có hiệu lực NGAY LẬP TỨC cho các vé bán TỪ THỜI ĐIỂM NÀY trở
//    đi (mọi lượt checkout luôn lấy giá "hiện hành" tại đúng lúc thanh
//    toán — xem checkout.service.ts).
//  - Vé ĐÃ BÁN trước đó hoàn toàn KHÔNG bị ảnh hưởng: giá của vé đã mua
//    được "chốt" (lưu cứng vào cột ticket_price của từng vé) ngay lúc mua,
//    và không bao giờ đọc lại bảng giá này nữa.
// Nhờ vậy đổi giá bao nhiêu lần trong tương lai cũng an toàn: vé cũ giữ
// giá cũ, vé mới theo giá mới, không cần xử lý gì thêm thủ công.
import React, { useEffect, useMemo, useState } from "react";
import { getCurrentPrices, getPriceHistory, changeTicketPrice } from "../api/ticketPrices";
import { useToast } from "../components/ToastContext";
import "./table.css";
import "../components/ui.css";

const SEAT_TYPE_LABELS = {
  standard: "Ghế thường",
  vip: "Ghế VIP",
  couple: "Ghế Couple",
};
const SEAT_TYPES = ["standard", "vip", "couple"];

function formatMoney(n) {
  return Number(n || 0).toLocaleString("vi-VN") + " đ";
}
function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
}

export default function PricingPage() {
  const toast = useToast();
  const [prices, setPrices] = useState(null); // { standard, vip, couple }
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState(null); // seat_type đang mở form đổi giá
  const [form, setForm] = useState({ price: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([getCurrentPrices(), getPriceHistory()]);
      setPrices(p);
      setHistory(h);
    } catch (err) {
      toast.error(err.message || "Không tải được bảng giá.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEdit(seatType) {
    setEditingType(seatType);
    setForm({ price: String(prices?.[seatType] ?? ""), note: "" });
  }

  function closeEdit() {
    setEditingType(null);
    setForm({ price: "", note: "" });
  }

  async function handleSave(e) {
    e.preventDefault();
    const priceNum = Number(form.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error("Giá vé phải là số và không được âm.");
      return;
    }
    setSaving(true);
    try {
      await changeTicketPrice({
        seat_type: editingType,
        price: priceNum,
        note: form.note?.trim() || undefined,
      });
      toast.success(
        `Đã cập nhật giá "${SEAT_TYPE_LABELS[editingType] || editingType}" thành ${formatMoney(
          priceNum,
        )}. Áp dụng cho vé mua từ bây giờ; vé đã mua trước đó giữ nguyên giá cũ.`,
      );
      closeEdit();
      await loadAll();
    } catch (err) {
      toast.error(err.message || "Đổi giá thất bại.");
    } finally {
      setSaving(false);
    }
  }

  const filteredHistory = useMemo(() => {
    if (!historyFilter) return history;
    return history.filter((h) => h.seat_type === historyFilter);
  }, [history, historyFilter]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Quản lý giá vé</div>
          <div className="page-sub">
            Đổi giá theo loại ghế — áp dụng ngay cho vé mua sau đó, không ảnh hưởng vé đã mua trước
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        {SEAT_TYPES.map((seatType) => (
          <div key={seatType} className="et-table-wrap" style={{ padding: 18 }}>
            <div className="page-sub" style={{ margin: 0 }}>
              {SEAT_TYPE_LABELS[seatType] || seatType}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, margin: "8px 0 14px" }}>
              {loading ? "…" : formatMoney(prices?.[seatType])}
            </div>
            <button
              type="button"
              className="ui-btn ui-btn-primary ui-btn-sm"
              onClick={() => openEdit(seatType)}
              disabled={loading}
            >
              Đổi giá
            </button>
          </div>
        ))}
      </div>

      {editingType && (
        <div className="et-table-wrap" style={{ padding: 18, marginBottom: 22, maxWidth: 480 }}>
          <div className="section-title" style={{ marginTop: 0 }}>
            Đổi giá — {SEAT_TYPE_LABELS[editingType] || editingType}
          </div>
          <form onSubmit={handleSave}>
            <div className="ui-field">
              <label>Giá mới (đ)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="ui-field">
              <label>Ghi chú (không bắt buộc)</label>
              <input
                type="text"
                placeholder="Vd. Tăng giá dịp lễ Tết 2027"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ui-btn ui-btn-primary" type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu giá mới"}
              </button>
              <button
                className="ui-btn ui-btn-ghost"
                type="button"
                onClick={closeEdit}
                disabled={saving}
              >
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        className="section-title"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
      >
        <span>Lịch sử đổi giá</span>
        <select
          value={historyFilter}
          onChange={(e) => setHistoryFilter(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">Tất cả loại ghế</option>
          {SEAT_TYPES.map((t) => (
            <option key={t} value={t}>
              {SEAT_TYPE_LABELS[t] || t}
            </option>
          ))}
        </select>
      </div>
      <div className="et-table-wrap">
        <table className="et-table">
          <thead>
            <tr>
              <th>Thời điểm</th>
              <th>Loại ghế</th>
              <th>Giá</th>
              <th>Ghi chú</th>
              <th>NV thực hiện</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan={5} className="et-status">
                  {loading ? "Đang tải..." : "Chưa có lịch sử đổi giá."}
                </td>
              </tr>
            )}
            {filteredHistory.map((h) => (
              <tr key={h.price_id}>
                <td>{formatDateTime(h.created_at)}</td>
                <td>{SEAT_TYPE_LABELS[h.seat_type] || h.seat_type}</td>
                <td>{formatMoney(h.price)}</td>
                <td>{h.note || "—"}</td>
                <td>{h.changed_by ? `#${h.changed_by}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
