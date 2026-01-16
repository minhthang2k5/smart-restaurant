import { Outlet } from "react-router-dom";
import CustomerBottomNav from "../../components/customerNav/CustomerBottomNav";

export default function CustomerLayout() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f6fa",
        paddingBottom: 86,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          padding: "12px 12px 0",
        }}
      >
        <Outlet />
      </div>
      <CustomerBottomNav />
    </div>
  );
}
