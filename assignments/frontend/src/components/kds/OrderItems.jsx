import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";

function OrderItemRow({ item, index, orderId }) {
  const itemStatus = item?.status;
  const icon =
    itemStatus === "ready" ? (
      <CheckCircleOutlined style={{ color: "#27ae60" }} />
    ) : itemStatus === "preparing" ? (
      <FireOutlined style={{ color: "#f39c12" }} />
    ) : (
      <ClockCircleOutlined style={{ color: "#7f8c8d" }} />
    );

  const key =
    item?.id ?? `${orderId ?? "order"}-${item?.item_name ?? "item"}-${index}`;

  return (
    <div
      key={key}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          background: "#fff1f5",
          color: "#db2777",
          width: 30,
          height: 30,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          flexShrink: 0,
          border: "1px solid #fbcfe8",
        }}
      >
        {item?.quantity || 1}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          {item?.item_name || "Item"}
        </div>
        
        {/* Display modifiers */}
        {Array.isArray(item?.modifiers) && item.modifiers.length > 0 && (
          <div
            style={{
              background: '#e6f7ff',
              padding: '4px 8px',
              borderRadius: 4,
              marginTop: 4,
              borderLeft: '2px solid #1890ff'
            }}
          >
            <div style={{ color: "#1890ff", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              OPTIONS:
            </div>
            <div style={{ color: "#3498db", fontSize: 12 }}>
              {item.modifiers.map((mod, idx) => (
                <span key={idx}>
                  {mod.option_name || mod.name || 'Unknown'}
                  {idx < item.modifiers.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Display special instructions */}
        {item?.special_instructions && item.special_instructions.trim().length > 0 && (
          <div
            style={{
              background: '#f9f0ff',
              padding: '4px 8px',
              borderRadius: 4,
              marginTop: 4,
              borderLeft: '2px solid #9b59b6'
            }}
          >
            <div style={{ color: "#9b59b6", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              ✎ SPECIAL NOTE:
            </div>
            <div style={{
              color: "#9b59b6",
              fontSize: 12,
              fontStyle: "italic",
              fontWeight: 600,
            }}>
              {item.special_instructions}
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 18 }}>{icon}</div>
    </div>
  );
}

export default function OrderItemsList({ items, orderId }) {
  if (!items?.length) {
    return <Typography.Text type="secondary">No items</Typography.Text>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it, idx) => (
        <OrderItemRow
          key={it?.id ?? idx}
          item={it}
          index={idx}
          orderId={orderId}
        />
      ))}
    </div>
  );
}
