// src/components/CrudSection.jsx
// Component CRUD dùng chung: tự sinh bảng + form Thêm/Sửa + xác nhận Xóa
// dựa trên khai báo "fields" (schema đơn giản), gọi thẳng API thật qua apiClient.
import React, { useMemo, useState } from "react";
import DataTable from "../pages/DataTable";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import ImageField from "./ImageField";
import TagsField from "./TagsField";
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
  // Bộ lọc chọn nhanh (dropdown) — dùng cho các trường khó gõ đúng chính tả
  // (thể loại, trạng thái...) thay vì bắt người dùng gõ tìm kiếm.
  // filterOptions: [{ key, label, allLabel?, getValues: (row) => string[] }]
  filterOptions,
  // Sắp xếp nhanh (dropdown) — vd. "Mới nhất / Cũ nhất".
  // sortOptions: [{ value, label, sort?: (a,b) => number }] — option đầu
  // tiên là lựa chọn mặc định khi mở trang.
  sortOptions,
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
  const [filterValues, setFilterValues] = useState({});
  const [sortValue, setSortValue] = useState(sortOptions?.[0]?.value ?? "");

  // Ô tìm kiếm gõ chữ — giữ nguyên như cũ, không thay thế.
  const searched = useMemo(() => {
    if (!searchable || !keyword.trim()) return rows;
    const kw = keyword.trim().toLowerCase();
    const keys = searchKeys || columns.map((c) => c.key);
    return rows.filter((r) =>
      keys.some((k) => String(r[k] ?? "").toLowerCase().includes(kw)),
    );
  }, [rows, keyword, searchable, searchKeys, columns]);

  // Danh sách giá trị duy nhất cho từng dropdown lọc (vd. các thể loại đang
  // có trong dữ liệu thật) — tự suy ra từ rows, không cần khai báo cứng.
  const filterValueLists = useMemo(() => {
    const map = {};
    (filterOptions || []).forEach((opt) => {
      const set = new Set();
      rows.forEach((r) => {
        const vals = opt.getValues ? opt.getValues(r) : [r[opt.key]];
        (vals || []).forEach((v) => {
          const s = v === null || v === undefined ? "" : String(v).trim();
          if (s) set.add(s);
        });
      });
      map[opt.key] = Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
    });
    return map;
  }, [rows, filterOptions]);

  // Áp các dropdown lọc (chọn giá trị có sẵn, không cần gõ) lên trên kết quả
  // tìm kiếm — người dùng có thể kết hợp cả gõ tìm kiếm lẫn chọn dropdown.
  const filteredByDropdowns = useMemo(() => {
    if (!filterOptions || filterOptions.length === 0) return searched;
    return filterOptions.reduce((acc, opt) => {
      const val = filterValues[opt.key];
      if (!val) return acc;
      return acc.filter((r) => {
        const vals = opt.getValues ? opt.getValues(r) : [r[opt.key]];
        return (vals || []).map(String).includes(val);
      });
    }, searched);
  }, [searched, filterOptions, filterValues]);

  // Sắp xếp nhanh (vd. mới nhất/cũ nhất) — áp sau cùng để không ảnh hưởng
  // tới việc tìm kiếm/lọc phía trên.
  const filtered = useMemo(() => {
    if (!sortOptions) return filteredByDropdowns;
    const opt = sortOptions.find((o) => o.value === sortValue);
    if (!opt || !opt.sort) return filteredByDropdowns;
    return [...filteredByDropdowns].sort(opt.sort);
  }, [filteredByDropdowns, sortOptions, sortValue]);

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

      {(searchable || filterOptions?.length > 0 || sortOptions?.length > 0) && (
        <div className="ui-table-toolbar">
          {searchable && (
            <input
              className="ui-table-search"
              placeholder="🔍 Tìm kiếm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          )}
          {(filterOptions || []).map((opt) => (
            <select
              key={opt.key}
              className="ui-table-select"
              value={filterValues[opt.key] ?? ""}
              onChange={(e) =>
                setFilterValues((v) => ({ ...v, [opt.key]: e.target.value }))
              }
            >
              <option value="">{opt.allLabel || `Tất cả ${opt.label}`}</option>
              {(filterValueLists[opt.key] || []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ))}
          {sortOptions?.length > 0 && (
            <select
              className="ui-table-select"
              value={sortValue}
              onChange={(e) => setSortValue(e.target.value)}
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <DataTable
        rows={filtered}
        loading={loading}
        error={error}
        columns={columns}
        onRowClick={renderDetail ? openDetail : undefined}
        actions={
          canEdit || canDelete
            ? (row) => (
                <>
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
                ) : f.type === "image" ? (
                  <ImageField
                    value={values[f.name] ?? ""}
                    onChange={(v) => setField(f.name, v)}
                    folder={f.folder}
                    placeholder={f.placeholder}
                  />
                ) : f.type === "tags" ? (
                  <TagsField
                    value={values[f.name] ?? ""}
                    onChange={(v) => setField(f.name, v)}
                    options={typeof f.options === "function" ? f.options() : f.options || []}
                    placeholder={f.placeholder}
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
                    min={typeof f.min === "function" ? f.min(editingRow) : f.min}
                    max={typeof f.max === "function" ? f.max(editingRow) : f.max}
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
          width={680}
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