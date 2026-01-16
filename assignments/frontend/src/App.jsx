import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, App as AntApp, theme } from "antd";
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
import AdminIndexRedirect from "./routes/AdminIndexRedirect";
import Login from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AuthError from "./pages/auth/AuthError";
import Staff from "./pages/admin/Staff";
import Settings from "./pages/admin/Settings";
import Profile from "./pages/admin/Profile";
import CustomerLogin from "./pages/customerAuth/CustomerLogin";
import CustomerRegister from "./pages/customerAuth/CustomerRegister";
import CustomerGoogleSuccess from "./pages/customerAuth/CustomerGoogleSuccess";
import CustomerAuthError from "./pages/customerAuth/CustomerAuthError";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerProtectedRoute from "./routes/CustomerProtectedRoute";
import CustomerLayout from "./layouts/customer/CustomerLayout";

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            {/* Customer auth */}
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/register" element={<CustomerRegister />} />
            <Route
              path="/customer/auth/error"
              element={<CustomerAuthError />}
            />
            <Route
              path="/register"
              element={<Navigate to="/customer/register" replace />}
            />

            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Google OAuth is customer-only */}
            <Route
              path="/auth/google-success"
              element={<CustomerGoogleSuccess />}
            />
            <Route path="/auth/error" element={<AuthError />} />

            {/* Admin (Staff) Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "waiter", "kitchen_staff"]}
                >
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminIndexRedirect />} />

              {/* Admin-only */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="categories"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Categories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="menu-items"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <MenuItems />
                  </ProtectedRoute>
                }
              />
              <Route
                path="menu-items/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <MenuItemDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="modifiers"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Modifiers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="staff"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Staff />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Admin + waiter */}
              <Route
                path="tables"
                element={
                  <ProtectedRoute allowedRoles={["admin", "waiter"]}>
                    <Tables />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders"
                element={
                  <ProtectedRoute allowedRoles={["admin", "waiter"]}>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />

              {/* Admin + kitchen_staff */}
              <Route
                path="kds"
                element={
                  <ProtectedRoute allowedRoles={["admin", "kitchen_staff"]}>
                    <KDS />
                  </ProtectedRoute>
                }
              />

              {/* Profile for all staff roles */}
              <Route
                path="profile"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "waiter", "kitchen_staff"]}
                  >
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Customer Routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/menu" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/payment/result" element={<PaymentResult />} />
              <Route
                path="/customer/profile"
                element={
                  <CustomerProtectedRoute>
                    <CustomerProfile />
                  </CustomerProtectedRoute>
                }
              />
            </Route>

            {/* Pages that should not show bottom nav */}
            <Route path="/menu/:itemId" element={<GuestItemDetail />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
