import { Badge, Card, Typography } from "antd";
import { laneMeta } from "./constants";

function KDSLaneColumn({ lane, orders, renderOrder }) {
  return (
    <Card
      key={lane}
      style={{ minWidth: 360, flex: 1 }}
      title={
        <Space size={8}>
          {laneMeta[lane].icon}
          <span>{laneMeta[lane].title}</span>
          <Badge count={orders.length} style={{ backgroundColor: "#db2777" }} />
        </Space>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxHeight: "calc(100vh - 320px)",
          overflowY: "auto",
          paddingRight: 6,
        }}
      >
        {orders.length === 0 ? (
          <Typography.Text type="secondary">No orders</Typography.Text>
        ) : (
          orders.map(renderOrder)
        )}
      </div>
    </Card>
  );
}
export default KDSLaneColumn;
