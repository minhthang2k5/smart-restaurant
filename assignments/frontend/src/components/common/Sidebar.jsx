import { Link, useLocation } from "react-router-dom";
import { Menu } from "antd";
import {
  DashboardOutlined,
  TableOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";

const Sidebar = ({ collapsed }) => {
  const location = useLocation();

  const menuItems = [
    {
      key: "/admin/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">Dashboard</Link>,
    },
    {
      key: "/admin/tables",
      icon: <TableOutlined />,
      label: <Link to="/admin/tables">Tables</Link>,
    },
  ];

  return (
    <>
      {/* Logo Section - Enhanced */}
      <div
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 28px",
          color: "white",
          fontSize: 20,
          fontWeight: "800",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(139, 92, 246, 0.15))",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          letterSpacing: "-0.5px",
        }}
      >
        <QrcodeOutlined
          style={{
            fontSize: 28,
            marginRight: collapsed ? 0 : 12,
            background: "linear-gradient(135deg, #f43f5e, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 8px rgba(244, 63, 94, 0.5))",
          }}
        />
        {!collapsed && (
          <span
            style={{
              background: "linear-gradient(135deg, #fff, #fce7f3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Smart Restaurant
          </span>
        )}
      </div>

      {/* Menu - Enhanced */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{
          borderRight: 0,
          background: "transparent",
          color: "white",
          fontSize: "15px",
        }}
        theme="dark"
      />
    </>
  );
};

export default Sidebar;
