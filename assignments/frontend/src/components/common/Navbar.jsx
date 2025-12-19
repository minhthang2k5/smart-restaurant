import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Dropdown } from "antd";

const Navbar = ({ collapsed, onToggleCollapse }) => {
  const userMenuItems = [
    {
      key: "profile",
      label: "Profile",
    },
    {
      key: "settings",
      label: "Settings",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Logout",
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      localStorage.removeItem("token");
      sessionStorage.clear();
      message.success("Logged out successfully");
      window.location.href = "/admin/tables";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      {/* Left: Toggle Button + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          style={{
            fontSize: "18px",
            width: 48,
            height: 48,
            borderRadius: "12px",
            transition: "all 0.3s",
          }}
          className="hover:bg-rose-50"
        />
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: "700",
            background: "linear-gradient(135deg, #f43f5e, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.5px",
          }}
        >
          Table Management
        </h2>
      </div>

      {/* Right: User Menu */}
      <Dropdown
        menu={{ items: userMenuItems, onClick: handleMenuClick }}
        placement="bottomRight"
      >
        <Button
          type="text"
          icon={<UserOutlined />}
          style={{
            fontSize: "16px",
            height: 48,
            borderRadius: "12px",
            padding: "0 20px",
            fontWeight: "600",
            transition: "all 0.3s",
          }}
          className="hover:bg-gradient-to-r hover:from-rose-50 hover:to-purple-50"
        >
          Admin
        </Button>
      </Dropdown>
    </div>
  );
};

export default Navbar;
