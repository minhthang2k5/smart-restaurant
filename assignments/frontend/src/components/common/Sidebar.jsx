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
          fontSize: 20,
          fontWeight: "700",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "rgba(255, 182, 193, 0.08)",
          borderBottom: "1px solid rgba(255, 182, 193, 0.2)",
          letterSpacing: "-0.3px",
        }}
      >
        <QrcodeOutlined
          style={{
            fontSize: 32,
            marginRight: collapsed ? 0 : 12,
            background: "linear-gradient(135deg, #FF6B9D, #FFA8B6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 2px 4px rgba(255, 107, 157, 0.3))",
          }}
        />
        {!collapsed && (
          <span
            style={{
              background: "linear-gradient(135deg, #EC4899, #FB7185)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: "700",
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
