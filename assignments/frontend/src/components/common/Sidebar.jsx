import { Link, useLocation } from "react-router-dom";
import { Menu } from "antd";
import {
  DashboardOutlined,
  TableOutlined,
  QrcodeOutlined,
  SolutionOutlined,
  FireOutlined,
  BarChartOutlined,
  TeamOutlined,
  TagsOutlined,
  CoffeeOutlined,
  ControlOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { normalizeRole } from "../../utils/roles";

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  const baseItems = [
    {
      key: "/admin/tables",
      icon: <TableOutlined />,
      label: <Link to="/admin/tables">Tables</Link>,
    },
    {
      key: "/admin/orders",
      icon: <SolutionOutlined />,
      label: <Link to="/admin/orders">Orders</Link>,
    },
    {
      key: "/admin/kds",
      icon: <FireOutlined />,
      label: <Link to="/admin/kds">Kitchen Display</Link>,
    },
  ];

  const adminOnlyItems = [
    {
      key: "/admin/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">Dashboard</Link>,
    },
    {
      key: "/admin/reports",
      icon: <BarChartOutlined />,
      label: <Link to="/admin/reports">Reports</Link>,
    },
    {
      key: "/admin/staff",
      icon: <TeamOutlined />,
      label: <Link to="/admin/staff">Staff</Link>,
    },
    {
      key: "/admin/categories",
      icon: <TagsOutlined />,
      label: <Link to="/admin/categories">Categories</Link>,
    },
    {
      key: "/admin/menu-items",
      icon: <CoffeeOutlined />,
      label: <Link to="/admin/menu-items">Menu Items</Link>,
    },
    {
      key: "/admin/modifiers",
      icon: <ControlOutlined />,
      label: <Link to="/admin/modifiers">Modifiers</Link>,
    },
  ];

  let menuItems = [];
  if (role === "admin") {
    menuItems = [...adminOnlyItems, ...baseItems];
  } else if (role === "waiter") {
    menuItems = baseItems.filter(
      (i) => i.key === "/admin/tables" || i.key === "/admin/orders"
    );
  } else if (role === "kitchen_staff") {
    menuItems = baseItems.filter((i) => i.key === "/admin/kds");
  } else {
    menuItems = baseItems;
  }

  return (
    <div
      style={{
        height: "100%",
        background: "#fff1f5", // rose-50
        borderRight: "1px solid #fbcfe8", // pink-200
      }}
    >
      {/* 🌸 Logo */}
      <div
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 24px",
          fontSize: 20,
          fontWeight: 700,
          background: "#ffe4e6", // rose-100
          borderBottom: "1px solid #fbcfe8",
        }}
      >
        <QrcodeOutlined
          style={{
            fontSize: 30,
            marginRight: collapsed ? 0 : 12,
            color: "#db2777", // pink-600
          }}
        />
        {!collapsed && (
          <span
            style={{
              color: "#db2777",
              fontWeight: 700,
            }}
          >
            Smart Restaurant
          </span>
        )}
      </div>

      {/* 🌸 Menu */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        theme="light"
        style={{
          background: "transparent",
          borderRight: 0,
          color: "#374151", // gray-700
          fontSize: 15,
        }}
      />
    </div>
  );
};

export default Sidebar;
