// src/pages/ProductsPage.jsx
import React from "react";
import useApiList from "../api/useApiList";
import DataTable from "./DataTable";
import "./table.css";

export default function ProductsPage() {
  const products = useApiList("products");
  const foodOrders = useApiList("food-orders");

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Sản phẩm & Đồ ăn</div>
        </div>
      </div>

      <div className="section-title">Danh sách sản phẩm</div>
      <DataTable
        rows={products.rows}
        loading={products.loading}
        error={products.error}
        columns={[
          { key: "product_id", label: "Mã SP" },
          { key: "product_name", label: "Tên sản phẩm" },
          { key: "price", label: "Giá" },
          { key: "stock_quantity", label: "Tồn kho" },
        ]}
      />

      <div className="section-title">Hóa đơn đồ ăn</div>
      <DataTable
        rows={foodOrders.rows}
        loading={foodOrders.loading}
        error={foodOrders.error}
        columns={[
          { key: "order_id", label: "Mã hóa đơn" },
          { key: "customer_id", label: "Khách hàng (ID)" },
          { key: "order_date", label: "Ngày đặt" },
          { key: "total_amount", label: "Tổng tiền" },
        ]}
      />
    </>
  );
}
