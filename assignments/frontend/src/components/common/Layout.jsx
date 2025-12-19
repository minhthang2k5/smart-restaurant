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
    <div className="dynamic-bg">
      <AntLayout style={{ minHeight: "100vh", background: "transparent" }}>
        {/* Sidebar - Glass Effect */}
        <Sider
          width={280}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "4px 0 24px rgba(0, 0, 0, 0.12)",
          }}
        >
          <Sidebar collapsed={collapsed} />
        </Sider>

        {/* Main Content */}
        <AntLayout style={{ background: "transparent" }}>
          {/* Navbar - Glass Effect */}
          <Header
            style={{
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(20px)",
              padding: "0 32px",
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
              height: "72px",
            }}
          >
            <Navbar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
          </Header>

          {/* Page Content - Transparent */}
          <Content
            style={{
              margin: "24px 24px",
              padding: 0,
              background: "transparent",
            }}
          >
            <Outlet />
          </Content>
        </AntLayout>
      </AntLayout>
    </div>
  );
};

export default Layout;
