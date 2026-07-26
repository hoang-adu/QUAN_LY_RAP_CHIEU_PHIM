
import React from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import CrudSection from "../components/CrudSection";
import "./table.css";

const LOW_STOCK_THRESHOLD = 20;

const FIELDS = [
  { name: "product_name", label: "Tên sản phẩm", required: true, fullWidth: true },
  { name: "price", label: "Giá bán (đ)", type: "number", required: true },
  { name: "stock_quantity", label: "Tồn kho", type: "number" },
];

function stockBadge(qty) {
  const q = Number(qty ?? 0);
  if (q <= 0) return <span className="et-badge cancel">Hết hàng</span>;
  if (q <= LOW_STOCK_THRESHOLD) return <span className="et-badge pending">Sắp hết ({q})</span>;
  return <span className="et-badge ok">{q}</span>;
}

export default function ProductsPage() {
  const products = useApiList("products");
  const foodOrders = useApiList("food-orders");
  const customers = useApiList("customers");

  const customerNameById = Object.fromEntries(
    customers.rows.map((c) => [String(c.customer_id), c.full_name]),
  );

  return (
    <>
      <CrudSection
        title="Sản phẩm & Đồ ăn"
        subtitle="Dữ liệu thật từ API /products"
        apiPath="products"
        idKey="product_id"
        rows={products.rows}
        loading={products.loading}
        error={products.error}
        reload={products.reload}
        fields={FIELDS}
        toDto={(v) => ({
          ...v,
          price: v.price === "" ? null : Number(v.price),
          stock_quantity: v.stock_quantity === "" ? 0 : Number(v.stock_quantity),
        })}
        columns={[
          { key: "product_id", label: "Mã SP" },
          { key: "product_name", label: "Tên sản phẩm" },
          {
            key: "price",
            label: "Giá",
            render: (v) => (v != null ? Number(v).toLocaleString("vi-VN") + " đ" : "—"),
          },
          { key: "stock_quantity", label: "Tồn kho", render: stockBadge },
        ]}
      />

      <div className="section-title">Hóa đơn đồ ăn</div>
      <DataTable
        rows={foodOrders.rows}
        loading={foodOrders.loading}
        error={foodOrders.error}
        columns={[
          { key: "order_id", label: "Mã hóa đơn" },
          {
            key: "customer_id",
            label: "Khách hàng",
            render: (v) => customerNameById[String(v)] || (v ? `#${v}` : "—"),
          },
          { key: "order_date", label: "Ngày đặt" },
          {
            key: "total_amount",
            label: "Tổng tiền",
            render: (v) => (v != null ? Number(v).toLocaleString("vi-VN") + " đ" : "—"),
          },
        ]}
        emptyText="Chưa có hóa đơn đồ ăn nào."
      />
    </>
  );
}
