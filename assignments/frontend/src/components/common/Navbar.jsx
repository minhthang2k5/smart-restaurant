import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = ({ collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

  const displayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : user?.email || "Admin";

  const handleMenuClick = ({ key }) => {
    if (key === "profile") {
      navigate("/admin/profile");
      return;
    }

    if (key === "settings") {
      navigate("/admin/settings");
      return;
    }

    if (key === "logout") {
      (async () => {
        try {
          await logout();
        } finally {
          sessionStorage.clear();
        }
        message.success("Logged out successfully");
        navigate("/login", { replace: true });
      })();
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
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          style={{
            fontSize: "20px",
            width: 52,
            height: 52,
            borderRadius: "16px",
            transition: "all 0.3s",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
          className="hover:bg-white/20"
        />
        <h2
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "800",
            color: "white",
            letterSpacing: "-0.5px",
            textShadow:
              "0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)",
            lineHeight: "1.2",
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
            height: 52,
            borderRadius: "16px",
            padding: "0 24px",
            fontWeight: "700",
            transition: "all 0.3s",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
          className="hover:bg-white/20"
        >
          {displayName}
        </Button>
      </Dropdown>
    </div>
  );
};

export default Navbar;
