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
      {/* Logo Section */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 24px",
          color: "white",
          fontSize: 18,
          fontWeight: "bold",
          transition: "all 0.2s",
        }}
      >
        <QrcodeOutlined
          style={{ fontSize: 24, marginRight: collapsed ? 0 : 8 }}
        />
        {!collapsed && <span>Smart Restaurant</span>}
      </div>

      {/* Menu */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
    </>
  );
};

export default Sidebar;
