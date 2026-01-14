import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import Layout from "./components/common/Layout";
import Tables from "./pages/admin/Tables";
import Dashboard from "./pages/admin/Dashboard";
import Menu from "./pages/customer/Menu";
import Categories from "./pages/admin/Categories";
import MenuItems from "./pages/admin/MenuItems";
import MenuItemDetail from "./pages/admin/MenuItemDetail";
import Modifiers from "./pages/admin/Modifiers";
import GuestItemDetail from "./pages/customer/GuestItemDetail";
import Cart from "./pages/customer/Cart";
import Orders from "./pages/customer/Orders";
import PaymentResult from "./pages/customer/PaymentResult";
import AdminOrders from "./pages/admin/AdminOrders";
import KDS from "./pages/admin/KDS";
import Reports from "./pages/admin/Reports";
import "./styles/global.css";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

const theme = {
  token: {
    colorPrimary: "#1890ff",
    borderRadius: 6,
  },
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/tables" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tables" element={<Tables />} />
              <Route path="categories" element={<Categories />} />
              <Route path="menu-items" element={<MenuItems />} />
              <Route path="menu-items/:id" element={<MenuItemDetail />} />
              <Route path="modifiers" element={<Modifiers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="kds" element={<KDS />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Customer Routes */}
            <Route path="/menu" element={<Menu />} />
            <Route path="/menu/:itemId" element={<GuestItemDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/payment/result" element={<PaymentResult />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/admin/tables" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
