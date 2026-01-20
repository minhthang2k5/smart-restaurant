import {
  AppstoreOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  UserOutlined,
  StarOutlined,
} from "@ant-design/icons";
import CustomerBottomNavItem from "./CustomerBottomNavItem";
import "../../styles/customerBottomNav.css";

export default function CustomerBottomNav() {
  return (
    <nav className="customer-bottom-nav" aria-label="Customer navigation">
      <div className="customer-bottom-nav__inner">
        <CustomerBottomNavItem
          to="/menu"
          label="Menu"
          icon={<AppstoreOutlined />}
        />
        <CustomerBottomNavItem
          to="/cart"
          label="Cart"
          icon={<ShoppingCartOutlined />}
        />
        <CustomerBottomNavItem
          to="/orders"
          label="Orders"
          icon={<FileTextOutlined />}
        />
        <CustomerBottomNavItem
          to="/customer/reviews"
          label="Reviews"
          icon={<StarOutlined />}
        />
        <CustomerBottomNavItem
          to="/customer/profile"
          label="Profile"
          icon={<UserOutlined />}
        />
      </div>
    </nav>
  );
}
