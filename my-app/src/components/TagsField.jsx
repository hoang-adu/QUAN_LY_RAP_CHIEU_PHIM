// src/components/TagsField.jsx
// Ô chọn nhiều giá trị dạng "thẻ" (tag) — dùng cho thể loại phim: người dùng
// BẤM CHỌN từ danh sách thể loại đã có trong hệ thống (không cần gõ), và
// vẫn có thể gõ thêm 1 thể loại hoàn toàn mới nếu chưa có sẵn. Value lưu
// dưới dạng chuỗi "A, B, C" để tương thích với cột `genre` (text tự do) đã
// có sẵn trong database — không cần đổi schema hay cột dữ liệu.
import React, { useState } from "react";
import "./ui.css";

function parseTags(value) {
  if (!value) return [];
  return String(value)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function TagsField({
  value,
  onChange,
  options = [],
  placeholder,
  addLabel = "+ Thêm",
}) {
  const [newTag, setNewTag] = useState("");
  const selected = parseTags(value);

  function commit(list) {
    onChange(list.join(", "));
  }

  function toggleOption(opt) {
    const exists = selected.some((s) => s.toLowerCase() === opt.toLowerCase());
    commit(exists ? selected.filter((t) => t.toLowerCase() !== opt.toLowerCase()) : [...selected, opt]);
  }

  function removeTag(tag) {
    commit(selected.filter((t) => t !== tag));
  }

  function addNewTag() {
    const t = newTag.trim();
    if (!t) return;
    if (!selected.some((s) => s.toLowerCase() === t.toLowerCase())) {
      commit([...selected, t]);
    }
    setNewTag("");
  }

  const availableOptions = options.filter(
    (opt) => !selected.some((s) => s.toLowerCase() === opt.toLowerCase()),
  );

  return (
    <div className="ui-tags-field">
      {selected.length > 0 && (
        <div className="ui-tags-field__selected">
          {selected.map((tag) => (
            <span className="ui-tags-field__chip" key={tag}>
              {tag}
              <button
                type="button"
                className="ui-tags-field__chip-remove"
                onClick={() => removeTag(tag)}
                aria-label={`Bỏ chọn ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {availableOptions.length > 0 && (
        <div className="ui-tags-field__options">
          {availableOptions.map((opt) => (
            <button
              type="button"
              key={opt}
              className="ui-tags-field__option"
              onClick={() => toggleOption(opt)}
            >
              + {opt}
            </button>
          ))}
        </div>
      )}

      <div className="ui-tags-field__add-row">
        <input
          type="text"
          value={newTag}
          placeholder={placeholder || "Chưa có trong danh sách? Gõ thể loại mới rồi bấm Thêm..."}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addNewTag();
            }
          }}
        />
        <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={addNewTag}>
          {addLabel}
        </button>
      </div>

      {selected.length === 0 && availableOptions.length === 0 && (
        <div className="ui-tags-field__hint">
          Hệ thống chưa có thể loại nào — gõ thể loại đầu tiên ở ô trên rồi bấm Thêm.
        </div>
      )}
    </div>
  );
}
