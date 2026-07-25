// src/pages/ProductsPage.jsx
import React, { useState } from "react";
import useApiList from "../api/useApiList";
import { isAdmin } from "../api/auth";
import { createItem, updateItem, removeItem } from "../api/apiClient";
import DataTable from "./DataTable";
import FormModal from "./FormModal";
import "./table.css";

const PRODUCT_FIELDS = [
  { key: "product_name", label: "Tên sản phẩm", required: true },
  { key: "price", label: "Giá", type: "number" },
  { key: "stock_quantity", label: "Tồn kho", type: "number" },
];

const FOOD_ORDER_FIELDS = [
  { key: "customer_id", label: "Khách hàng (ID)", type: "number" },
  { key: "total_amount", label: "Tổng tiền", type: "number" },
];

export default function ProductsPage() {
  const admin = isAdmin();
  const products = useApiList("products");
  const foodOrders = useApiList("food-orders");

  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderModal, setOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const handleProductSubmit = async (payload) => {
    if (editingProduct) await updateItem("products", editingProduct.product_id, payload);
    else await createItem("products", payload);
    products.reload();
  };

  const handleProductDelete = async (row) => {
    if (!window.confirm(`Xóa sản phẩm "${row.product_name}"?`)) return;
    try {
      await removeItem("products", row.product_id);
      products.reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  const handleOrderSubmit = async (payload) => {
    if (editingOrder) await updateItem("food-orders", editingOrder.order_id, payload);
    else await createItem("food-orders", payload);
    foodOrders.reload();
  };

  const handleOrderDelete = async (row) => {
    if (!window.confirm(`Xóa hóa đơn đồ ăn #${row.order_id}?`)) return;
    try {
      await removeItem("food-orders", row.order_id);
      foodOrders.reload();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Sản phẩm & Đồ ăn</div>
          <div className="page-sub">Tổng quan</div>
        </div>
      </div>

      <div className="page-head">
        <div className="section-title">Danh sách sản phẩm</div>
        {admin && (
          <button
            className="page-btn-add"
            onClick={() => {
              setEditingProduct(null);
              setProductModal(true);
            }}
          >
            + Thêm sản phẩm
          </button>
        )}
      </div>
      <DataTable
        rows={products.rows}
        loading={products.loading}
        error={products.error}
        rowKey="product_id"
        columns={[
          { key: "product_id", label: "Mã SP" },
          { key: "product_name", label: "Tên sản phẩm" },
          { key: "price", label: "Giá" },
          { key: "stock_quantity", label: "Tồn kho" },
        ]}
        onEdit={
          admin
            ? (row) => {
                setEditingProduct(row);
                setProductModal(true);
              }
            : undefined
        }
        onDelete={admin ? handleProductDelete : undefined}
      />

      <div className="page-head">
        <div className="section-title">Hóa đơn đồ ăn</div>
        {admin && (
          <button
            className="page-btn-add"
            onClick={() => {
              setEditingOrder(null);
              setOrderModal(true);
            }}
          >
            + Thêm hóa đơn
          </button>
        )}
      </div>
      <DataTable
        rows={foodOrders.rows}
        loading={foodOrders.loading}
        error={foodOrders.error}
        rowKey="order_id"
        columns={[
          { key: "order_id", label: "Mã hóa đơn" },
          { key: "customer_id", label: "Khách hàng (ID)" },
          { key: "order_date", label: "Ngày đặt" },
          { key: "total_amount", label: "Tổng tiền" },
        ]}
        onEdit={
          admin
            ? (row) => {
                setEditingOrder(row);
                setOrderModal(true);
              }
            : undefined
        }
        onDelete={admin ? handleOrderDelete : undefined}
      />

      <FormModal
        open={productModal}
        title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        fields={PRODUCT_FIELDS}
        initialValues={editingProduct}
        submitLabel={editingProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
        onClose={() => setProductModal(false)}
        onSubmit={handleProductSubmit}
      />

      <FormModal
        open={orderModal}
        title={editingOrder ? "Sửa hóa đơn đồ ăn" : "Thêm hóa đơn đồ ăn"}
        fields={FOOD_ORDER_FIELDS}
        initialValues={editingOrder}
        submitLabel={editingOrder ? "Lưu thay đổi" : "Thêm hóa đơn"}
        onClose={() => setOrderModal(false)}
        onSubmit={handleOrderSubmit}
      />
    </>
  );
}
