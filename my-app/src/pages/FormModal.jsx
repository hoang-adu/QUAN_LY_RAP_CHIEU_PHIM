// src/pages/FormModal.jsx
// Modal form dùng chung cho thêm/sửa dữ liệu — gọi API thật (POST/PATCH) qua apiClient.
import React, { useEffect, useState } from "react";
import "./FormModal.css";

export default function FormModal({
  open,
  title,
  fields,
  initialValues,
  submitLabel = "Lưu",
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      const base = {};
      fields.forEach((f) => {
        base[f.key] = initialValues?.[f.key] ?? "";
      });
      setValues(base);
      setError("");
    }
  }, [open, initialValues, fields]);

  if (!open) return null;

  const handleChange = (key, raw, type) => {
    const value = type === "number" ? raw : raw;
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !String(values[f.key] ?? "").trim());
    if (missing) {
      setError(`${missing.label} không được để trống`);
      return;
    }

    const payload = {};
    fields.forEach((f) => {
      const raw = values[f.key];
      if (raw === "" || raw === undefined) return;
      payload[f.key] = f.type === "number" ? Number(raw) : raw;
    });

    setSaving(true);
    setError("");
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fm-overlay" onClick={onClose}>
      <div className="fm-box" onClick={(e) => e.stopPropagation()}>
        <div className="fm-head">
          <div className="fm-title">{title}</div>
          <button type="button" className="fm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fm-body">
            {fields.map((f) => (
              <div className="fm-field" key={f.key}>
                <label>
                  {f.label}
                  {f.required && <span className="fm-req"> *</span>}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    value={values[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => handleChange(f.key, e.target.value, f.type)}
                  />
                ) : f.type === "select" ? (
                  <select
                    value={values[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value, f.type)}
                  >
                    <option value="">— Chọn —</option>
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || "text"}
                    value={values[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => handleChange(f.key, e.target.value, f.type)}
                  />
                )}
              </div>
            ))}
          </div>

          {error && <div className="fm-error">{error}</div>}

          <div className="fm-foot">
            <button type="button" className="fm-btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="fm-btn-save" disabled={saving}>
              {saving ? "Đang lưu..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
