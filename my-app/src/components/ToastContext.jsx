// src/components/ToastContext.jsx
// Hệ thống thông báo (toast) dùng chung: gọi toast.success(...) / toast.error(...)
// ở bất kỳ page nào sau khi thao tác Thêm/Sửa/Xóa thành công hay thất bại.
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import "./ui.css";

const ToastCtx = createContext(null);

let idSeq = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (message, type = "info", duration = 3500) => {
      const id = idSeq++;
      setToasts((list) => [...list, { id, message, type }]);
      timers.current[id] = setTimeout(() => remove(id), duration);
      return id;
    },
    [remove],
  );

  const api = {
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "error"),
    info: (msg) => push(msg, "info"),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
            <span className="toast-icon">
              {t.type === "success" ? "✅" : t.type === "error" ? "⚠️" : "ℹ️"}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // Fallback an toàn nếu lỡ dùng ngoài Provider — tránh crash toàn app
    return { success: () => {}, error: () => {}, info: () => {} };
  }
  return ctx;
}
