// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "./layout/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import RoomsPage from "./pages/RoomsPage";
import ShowtimesPage from "./pages/ShowtimesPage";
import BookingsPage from "./pages/BookingsPage";
import PaymentsPage from "./pages/PaymentsPage";
import ProductsPage from "./pages/ProductsPage";
import CustomersPage from "./pages/CustomersPage";
import EmployeesPage from "./pages/EmployeesPage";
import StatsPage from "./pages/StatsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang đăng nhập — không bọc Sidebar/Topbar */}
        <Route path="/login" element={<LoginPage />} />

        {/* Mọi trang còn lại yêu cầu đã đăng nhập (Admin hoặc Nhân viên) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/movies" element={<MoviesPage />} />
                  <Route path="/rooms" element={<RoomsPage />} />
                  <Route path="/showtimes" element={<ShowtimesPage />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/payments" element={<PaymentsPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
