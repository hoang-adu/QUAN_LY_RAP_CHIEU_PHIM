// src/layout/DashboardLayout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

// Layout mẫu Câu 5: Sidebar cố định trái + Topbar cố định trên + nội dung route hiện tại
export default function DashboardLayout({ children }) {
  return (
    <div className="qlrcp-app">
      <Sidebar />
      <div className="qlrcp-main">
        <Topbar />
        <div className="qlrcp-content">{children}</div>
      </div>
    </div>
  );
}
