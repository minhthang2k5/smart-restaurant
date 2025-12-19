import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import Layout from "./components/common/Layout";
import Tables from "./pages/admin/Tables";
import Dashboard from "./pages/admin/Dashboard";
import Menu from "./pages/customer/Menu"; // ← New import
import "./styles/global.css";

const theme = {
  token: {
    colorPrimary: "#1890ff",
    borderRadius: 6,
  },
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={<Layout />}>
            <Route index element={<Navigate to="/admin/tables" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tables" element={<Tables />} />
          </Route>

          {/* Customer Routes */}
          <Route path="/menu" element={<Menu />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/admin/tables" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
