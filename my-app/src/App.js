// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "./layout/ProtectedRoute";
import AdminRoute from "./layout/AdminRoute";
import CustomerRoute from "./layout/CustomerRoute";
import { ToastProvider } from "./components/ToastContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import CustomerAccountPage from "./pages/CustomerAccountPage";
import CustomerBookingPage from "./pages/CustomerBookingPage";
import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import RoomsPage from "./pages/RoomsPage";
import ShowtimesPage from "./pages/ShowtimesPage";
import BookingsPage from "./pages/BookingsPage";
import NewBookingPage from "./pages/NewBookingPage";
import PaymentsPage from "./pages/PaymentsPage";
import ProductsPage from "./pages/ProductsPage";
import CustomersPage from "./pages/CustomersPage";
import EmployeesPage from "./pages/EmployeesPage";
import TicketCheckInPage from "./pages/TicketCheckInPage";
import StatsPage from "./pages/StatsPage";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Trang đăng nhập/đăng ký — không bọc Sidebar/Topbar */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Trang tài khoản + đặt vé online của khách hàng — cũng không dùng dashboard Admin */}
          <Route
            path="/account"
            element={
              <CustomerRoute>
                <CustomerAccountPage />
              </CustomerRoute>
            }
          />
          <Route
            path="/book"
            element={
              <CustomerRoute>
                <CustomerBookingPage />
              </CustomerRoute>
            }
          />

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
                    <Route path="/bookings/new" element={<NewBookingPage />} />
                    <Route path="/tickets/checkin" element={<TicketCheckInPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route
                      path="/employees"
                      element={
                        <AdminRoute>
                          <EmployeesPage />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/stats"
                      element={
                        <AdminRoute>
                          <StatsPage />
                        </AdminRoute>
                      }
                    />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;