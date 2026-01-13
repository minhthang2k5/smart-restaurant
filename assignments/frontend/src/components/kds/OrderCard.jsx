import { Card, Divider, Tag, Typography } from "antd";
import { LANE, laneMeta, OVERDUE_MINUTES } from "./constants.jsx";
import {
  formatElapsed,
  getOrderNumberLabel,
  getTableLabel,
  isNewPendingOrder,
  orderTimerTone,
  safeDate,
} from "./utils";
import { BellOutlined, ClockCircleOutlined } from "@ant-design/icons";
import OrderItemsList from "./OrderItems";
import OrderActions from "./OrderActions";

function OrderCard({ order, lane, nowMs, onStartCooking, onMarkReady }) {
  const createdAt = safeDate(order?.created_at);
  const elapsedMs = createdAt ? nowMs - createdAt.getTime() : 0;
  const tone = orderTimerTone(elapsedMs);

  const borderColor = laneMeta[lane]?.border || "#d9d9d9";
  const urgent = tone === "danger" && lane !== LANE.ready;

  const items = Array.isArray(order?.items) ? order.items : [];

  return (
    <Card
      key={order?.id || getOrderNumberLabel(order)}
      size="small"
      style={{
        borderLeft: `4px solid ${urgent ? "#ff4d4f" : borderColor}`,
        boxShadow: urgent ? "0 0 0 2px rgba(255, 77, 79, 0.12)" : "none",
        borderRadius: 12,
      }}
      bodyStyle={{ padding: 12 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography.Text strong>{getOrderNumberLabel(order)}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {createdAt ? createdAt.toLocaleString() : "—"}
          </Typography.Text>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <Tag color="magenta" style={{ margin: 0, fontWeight: 700 }}>
            {getTableLabel(order)}
          </Tag>

          {createdAt ? (
            <Tag
              icon={<ClockCircleOutlined />}
              color={
                tone === "danger"
                  ? "red"
                  : tone === "warning"
                  ? "orange"
                  : "default"
              }
              style={{
                margin: 0,
                fontWeight: tone === "danger" ? 700 : 500,
              }}
            >
              {formatElapsed(elapsedMs)}
            </Tag>
          ) : null}
        </div>
      </div>

      {lane === LANE.received && isNewPendingOrder(order, nowMs) ? (
        <div style={{ marginTop: 10 }}>
          <Tag color="gold" style={{ fontWeight: 700 }}>
            <BellOutlined /> NEW ORDER — Just now
          </Tag>
        </div>
      ) : null}

      {urgent && lane === LANE.preparing ? (
        <div style={{ marginTop: 10 }}>
          <Tag color="red" style={{ fontWeight: 700 }}>
            ⚠ OVERDUE — Target: {OVERDUE_MINUTES} min
          </Tag>
        </div>
      ) : null}

      <div style={{ marginTop: 10 }}>
        <OrderItemsList items={items} orderId={order?.id} />
      </div>

      <Divider style={{ margin: "12px 0" }} />

      <div style={{ display: "flex", gap: 10 }}>
        <OrderActions
          lane={lane}
          order={order}
          onStartCooking={onStartCooking}
          onMarkReady={onMarkReady}
        />
      </div>
    </Card>
  );
}

export default OrderCard;
