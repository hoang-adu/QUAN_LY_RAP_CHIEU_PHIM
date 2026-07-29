// src/components/ImageField.jsx
// Ô nhập ảnh dùng chung: khách/nhân viên có thể (1) dán thẳng URL ảnh có sẵn
// trên mạng, HOẶC (2) bấm "Tải ảnh lên" để chọn file từ máy — file sẽ được
// upload lên backend (POST /uploads/image), rồi tự điền URL trả về vào cùng
// 1 ô. Cả 2 cách đều lưu vào cùng 1 cột (vd. poster) nên phía backend không
// cần biết ảnh đến từ đâu.
import React, { useRef, useState } from "react";
import { resolveAssetUrl } from "../api/apiClient";
import { uploadImage, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "../api/uploads";
import "./ui.css";

export default function ImageField({ value, onChange, folder = "misc", placeholder }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [broken, setBroken] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    // Cho phép chọn lại đúng file cũ lần nữa (onChange không bắn nếu giữ nguyên value).
    e.target.value = "";
    if (!file) return;

    setUploadError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Chỉ chấp nhận file ảnh JPEG, PNG, WEBP hoặc GIF.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError("Ảnh quá lớn — tối đa 5MB.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file, folder);
      setBroken(false);
      onChange(result.url);
    } catch (err) {
      setUploadError(err.message || "Tải ảnh lên thất bại, vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  }

  const previewSrc = value ? resolveAssetUrl(value) : null;

  return (
    <div className="ui-image-field">
      <div className="ui-image-field__row">
        <input
          type="text"
          value={value ?? ""}
          placeholder={placeholder || "Dán URL ảnh (https://...) hoặc tải ảnh lên"}
          onChange={(e) => {
            setBroken(false);
            onChange(e.target.value);
          }}
        />
        <button
          type="button"
          className="ui-btn ui-btn-ghost ui-btn-sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Đang tải..." : "📁 Tải ảnh lên"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {uploadError && <div className="ui-image-field__error">{uploadError}</div>}

      {previewSrc && !broken && (
        <img
          className="ui-image-field__preview"
          src={previewSrc}
          alt="Xem trước"
          onError={() => setBroken(true)}
        />
      )}
      {previewSrc && broken && (
        <div className="ui-image-field__error">Không tải được ảnh xem trước từ URL này.</div>
      )}
    </div>
  );
}
