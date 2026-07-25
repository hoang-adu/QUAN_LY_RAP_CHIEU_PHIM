// src/components/Modal.jsx
import React, { useEffect } from "react";
import "./ui.css";

export default function Modal({ open, title, onClose, children, width = 520 }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-modal-overlay" onMouseDown={onClose}>
      <div
        className="ui-modal-card"
        style={{ maxWidth: width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ui-modal-head">
          <div className="ui-modal-title">{title}</div>
          <button type="button" className="ui-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  );
}
