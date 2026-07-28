// src/components/CrudSection.jsx
// Component CRUD dùng chung: tự sinh bảng + form Thêm/Sửa + xác nhận Xóa
// dựa trên khai báo "fields" (schema đơn giản), gọi thẳng API thật qua apiClient.
import React, { useMemo, useState } from "react";
import DataTable from "../pages/DataTable";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./ToastContext";
import { createItem, updateItem, removeItem } from "../api/apiClient";
import "./ui.css";

function emptyValuesFromFields(fields) {
  const obj = {};
  fields.forEach((f) => {
    obj[f.name] = f.type === "number" ? "" : "";
  });
  return obj;
}

function valuesFromRow(fields, row) {
  const obj = {};
  fields.forEach((f) => {
    const v = row[f.name];
    obj[f.name] = v === null || v === undefined ? "" : v;
  });
  return obj;
}

export default function CrudSection({
  title,
  subtitle,
  apiPath,
  idKey,
  columns,
  fields,
  rows,
  loading,
  error,
  reload,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  toDto, // (values, isEdit) => dto gửi lên API (tùy biến nếu cần ép kiểu)
  searchable = true,
  searchKeys, // mảng key dùng để tìm kiếm; mặc định dùng tất cả cột hiển thị
  extraHeaderButton,
  renderDetail, // (row) => ReactNode — nếu truyền vào: bấm dòng/nút "Xem" sẽ mở modal thông tin chi tiết (chỉ xem)
  detailTitle, // (row) => string — tiêu đề modal chi tiết, mặc định dùng title chung
}) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [confirmRow, setConfirmRow] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [detailRow, setDetailRow] = useState(null);

  const filtered = useMemo(() => {
    if (!searchable || !keyword.trim()) return rows;
    const kw = keyword.trim().toLowerCase();
    const keys = searchKeys || columns.map((c) => c.key);
    return rows.filter((r) =>
      keys.some((k) => String(r[k] ?? "").toLowerCase().includes(kw)),
    );
  }, [rows, keyword, searchable, searchKeys, columns]);

  function openCreate() {
    setEditingRow(null);
    setValues(emptyValuesFromFields(fields));
    setFormError(null);
    setModalOpen(true);
  }

  function openDetail(row) {
    setDetailRow(row);
  }

  function closeDetail() {
    setDetailRow(null);
  }

  function openEdit(row) {
    setEditingRow(row);
    setValues(valuesFromRow(fields, row));
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
  }

  function setField(name, val) {
    setValues((v) => ({ ...v, [name]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    // Kiểm tra required cơ bản
    for (const f of fields) {
      const isRequired =
        typeof f.required === "function" ? f.required(!!editingRow) : f.required;
      if (isRequired && !String(values[f.name] ?? "").trim()) {
        setFormError(`"${f.label}" không được để trống.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const dto = toDto ? toDto(values, !!editingRow) : values;
      if (editingRow) {
        await updateItem(apiPath, editingRow[idKey], dto);
        toast.success(`Đã cập nhật ${title.toLowerCase()}.`);
      } else {
        await createItem(apiPath, dto);
        toast.success(`Đã thêm ${title.toLowerCase()} mới.`);
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirmRow) return;
    setDeleting(true);
    try {
      await removeItem(apiPath, confirmRow[idKey]);
      toast.success("Đã xóa bản ghi.");
      setConfirmRow(null);
      reload();
    } catch (err) {
      toast.error(err.message || "Xóa thất bại, có thể bản ghi đang được sử dụng ở nơi khác.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">{title}</div>
          {subtitle && <div className="page-sub">{subtitle}</div>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {extraHeaderButton}
          {canCreate && (
            <button className="ui-btn ui-btn-primary" onClick={openCreate}>
              + Thêm mới
            </button>
          )}
        </div>
      </div>

      {searchable && (
        <div className="ui-table-toolbar">
          <input
            className="ui-table-search"
            placeholder="🔍 Tìm kiếm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      )}

      <DataTable
        rows={filtered}
        loading={loading}
        error={error}
        columns={columns}
        onRowClick={renderDetail ? openDetail : undefined}
        actions={
          renderDetail || canEdit || canDelete
            ? (row) => (
                <>
                  {renderDetail && (
                    <button className="ui-btn ui-btn-ghost ui-btn-sm" onClick={() => openDetail(row)}>
                      Xem
                    </button>
                  )}
                  {canEdit && (
                    <button className="ui-btn ui-btn-ghost ui-btn-sm" onClick={() => openEdit(row)}>
                      Sửa
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="ui-btn ui-btn-danger ui-btn-sm"
                      onClick={() => setConfirmRow(row)}
                    >
                      Xóa
                    </button>
                  )}
                </>
              )
            : undefined
        }
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingRow ? `Sửa ${title.toLowerCase()}` : `Thêm ${title.toLowerCase()}`}
      >
        <form onSubmit={handleSubmit}>
          {formError && <div className="ui-form-error">{formError}</div>}
          <div className="ui-form-grid">
            {fields.map((f) => (
              <div
                key={f.name}
                className={"ui-field" + (f.fullWidth ? " span-2" : "")}
              >
                <label>
                  {f.label}
                  {(typeof f.required === "function"
                    ? f.required(!!editingRow)
                    : f.required) && <span className="req"> *</span>}
                </label>

                {f.type === "select" ? (
                  <select
                    value={values[f.name] ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                    disabled={
                      typeof f.disabled === "function" ? f.disabled(editingRow) : f.disabled
                    }
                  >
                    <option value="">-- Chọn --</option>
                    {(f.options || []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={values[f.name] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setField(f.name, e.target.value)}
                  />
                ) : (
                  <input
                    type={f.type || "text"}
                    value={values[f.name] ?? ""}
                    placeholder={
                      f.type === "password" && editingRow
                        ? "Để trống nếu không đổi mật khẩu"
                        : f.placeholder
                    }
                    onChange={(e) => setField(f.name, e.target.value)}
                    step={f.type === "number" ? f.step || "any" : undefined}
                    disabled={
                      typeof f.disabled === "function" ? f.disabled(editingRow) : f.disabled
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="ui-form-actions">
            <button type="button" className="ui-btn ui-btn-ghost" onClick={closeModal} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="ui-btn ui-btn-primary" disabled={submitting}>
              {submitting ? "Đang lưu..." : editingRow ? "Lưu thay đổi" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

      {renderDetail && (
        <Modal
          open={!!detailRow}
          onClose={closeDetail}
          title={detailRow ? (detailTitle ? detailTitle(detailRow) : title) : ""}
          width={620}
        >
          {detailRow && renderDetail(detailRow)}
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirmRow}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa bản ghi này? Hành động này không thể hoàn tác.`}
        onCancel={() => setConfirmRow(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}