import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Layout as AntLayout } from "antd";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const { Header, Sider, Content } = AntLayout;

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        theme="dark"
        width={250}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
      >
        <Sidebar collapsed={collapsed} />
      </Sider>

      {/* Main Content */}
      <AntLayout>
        {/* Navbar */}
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Navbar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
        </Header>

        {/* Page Content */}
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#fff",
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
