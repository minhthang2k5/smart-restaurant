import { Outlet, Link, useLocation } from "react-router-dom";
import { Layout as AntLayout, Menu } from "antd";
import {
  TableOutlined,
  DashboardOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = AntLayout;

const Layout = () => {
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
    <AntLayout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider theme="dark" width={250}>
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          <QrcodeOutlined style={{ marginRight: 8 }} />
          Smart Restaurant
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>

      {/* Main Content */}
      <AntLayout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0 }}>Table Management</h2>
          {/* TODO: Add user menu */}
        </Header>

        <Content
          style={{ margin: "24px 16px", padding: 24, background: "#fff" }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
