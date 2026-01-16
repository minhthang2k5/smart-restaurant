export default function CustomerAuthShell({
  children,
  title,
  subtitle,
  footer,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
        padding: "40px 16px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", padding: "40px 16px 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 10 }}>🍽️</div>
          <div style={{ color: "white", fontSize: 28, fontWeight: 800 }}>
            Smart Restaurant
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Scan. Order. Enjoy.
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 28,
            padding: 24,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22, color: "#2c3e50" }}>{title}</h2>
          {subtitle ? (
            <div style={{ marginTop: 6, color: "#7f8c8d", fontSize: 14 }}>
              {subtitle}
            </div>
          ) : null}

          <div style={{ marginTop: 20 }}>{children}</div>

          {footer ? <div style={{ marginTop: 18 }}>{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
