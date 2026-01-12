import { Space, Tag } from "antd";

function KDSStatsRow({
  receivedCount,
  preparingCount,
  readyCount,
  overdueCount,
}) {
  return (
    <Space size={16} wrap>
      <Tag color="gold" style={{ margin: 0, fontWeight: 700 }}>
        Pending: {receivedCount}
      </Tag>
      <Tag color="processing" style={{ margin: 0, fontWeight: 700 }}>
        Cooking: {preparingCount}
      </Tag>
      <Tag color="green" style={{ margin: 0, fontWeight: 700 }}>
        Ready: {readyCount}
      </Tag>
      <Tag
        color={overdueCount > 0 ? "red" : "default"}
        style={{ margin: 0, fontWeight: 700 }}
      >
        Overdue: {overdueCount}
      </Tag>
    </Space>
  );
}

export default KDSStatsRow;
