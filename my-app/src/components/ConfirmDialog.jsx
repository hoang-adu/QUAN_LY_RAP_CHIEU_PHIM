// src/components/ConfirmDialog.jsx
import React from "react";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title = "Xác nhận",
  message,
  confirmLabel = "Xóa",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} width={400}>
      <p className="ui-confirm-msg">{message}</p>
      <div className="ui-form-actions">
        <button type="button" className="ui-btn ui-btn-ghost" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
        <button
          type="button"
          className={"ui-btn " + (danger ? "ui-btn-danger" : "ui-btn-primary")}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
