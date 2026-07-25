
import React from "react";
import useApiList from "../api/useApiList";
import CrudSection from "../components/CrudSection";
import { isAdmin } from "../api/auth";
import "./table.css";

const FIELDS = [
  { name: "full_name", label: "Họ tên", required: true },
  { name: "phone", label: "Số điện thoại" },
  { name: "email", label: "Email", required: true, type: "email" },
  {
    name: "password",
    label: "Mật khẩu",
    type: "password",
    required: (isEdit) => !isEdit, // bắt buộc khi tạo mới, không bắt buộc khi sửa
  },
  { name: "points", label: "Điểm tích lũy", type: "number" },
];

export default function CustomersPage() {
  const { rows, loading, error, reload } = useApiList("customers");
  const admin = isAdmin();

  return (
    <CrudSection
      title="Khách hàng"
      subtitle="Dữ liệu thật từ API /customers"
      apiPath="customers"
      idKey="customer_id"
      rows={rows}
      loading={loading}
      error={error}
      reload={reload}
      fields={FIELDS}
      canCreate
      canEdit
      canDelete={admin}
      toDto={(v, isEdit) => {
        const dto = { ...v, points: v.points === "" ? 0 : Number(v.points) };
        if (isEdit && !dto.password) delete dto.password; // không đổi mật khẩu nếu để trống
        return dto;
      }}
      columns={[
        { key: "customer_id", label: "Mã KH" },
        { key: "full_name", label: "Họ tên" },
        { key: "phone", label: "Số điện thoại" },
        { key: "email", label: "Email" },
        { key: "points", label: "Điểm tích lũy" },
      ]}
    />
  );
}
