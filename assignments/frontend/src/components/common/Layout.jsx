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
    <div className="dynamic-bg h-screen overflow-hidden">
      <AntLayout style={{ height: "100vh", background: "transparent", overflow: "hidden" }}>
        {/* Sidebar - Modern Glass - Fixed */}
        <Sider
          width={280}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRight: "1px solid rgba(255, 182, 193, 0.25)",
            boxShadow: "4px 0 40px rgba(255, 182, 193, 0.1)",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <Sidebar collapsed={collapsed} />
        </Sider>

        {/* Main Content */}
        <AntLayout style={{ background: "transparent", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Navbar - Distinct Gradient - Fixed */}
          <Header
            style={{
              position: "relative",
              background: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
              padding: "0 40px",
              display: "flex",
              alignItems: "center",
              borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 10px 40px rgba(236, 72, 153, 0.3), 0 4px 12px rgba(139, 92, 246, 0.2)",
              height: "80px",
              flexShrink: 0,
            }}
          >
            <Navbar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
          </Header>

          {/* Page Content - Scrollable Area Only */}
          <Content
            style={{
              padding: 0,
              background: "transparent",
              flex: 1,
              overflowY: "auto",
              flexDirection: "column",
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
