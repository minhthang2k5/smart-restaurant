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
      console.log("Logout clicked");
      // TODO: Implement logout logic
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
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          style={{ fontSize: "16px", width: 48, height: 48 }}
        />
        <h2 style={{ margin: 0 }}>Table Management</h2>
      </div>

      {/* Right: User Menu */}
      <Dropdown
        menu={{ items: userMenuItems, onClick: handleMenuClick }}
        placement="bottomRight"
      >
        <Button
          type="text"
          icon={<UserOutlined />}
          style={{ fontSize: "16px", height: 48 }}
        >
          Admin
        </Button>
      </Dropdown>
    </div>
  );
};

export default Navbar;
