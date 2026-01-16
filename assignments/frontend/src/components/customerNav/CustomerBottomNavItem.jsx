import { NavLink } from "react-router-dom";

export default function CustomerBottomNavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? "customer-bottom-nav__item is-active"
          : "customer-bottom-nav__item"
      }
    >
      <span className="customer-bottom-nav__icon">{icon}</span>
      <span className="customer-bottom-nav__label">{label}</span>
    </NavLink>
  );
}
