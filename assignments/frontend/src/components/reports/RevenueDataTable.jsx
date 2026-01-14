import { Card, Table } from "antd";
import { formatMoney, formatNumber } from "../../utils/format";

export default function RevenueDataTable({ dataPoints, loading }) {
  const data = Array.isArray(dataPoints) ? dataPoints : [];

  const columns = [
    {
      title: "Period",
      dataIndex: "period",
      key: "period",
      width: 140,
    },
    {
      title: "Orders",
      dataIndex: "orderCount",
      key: "orderCount",
      width: 100,
      render: (v) => formatNumber(v),
    },
    {
      title: "Revenue",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      width: 140,
      render: (v) => formatMoney(v),
    },
    {
      title: "Avg Order Value",
      dataIndex: "avgOrderValue",
      key: "avgOrderValue",
      width: 160,
      render: (v) => formatMoney(v),
    },
  ];

  return (
    <Card title="Revenue Data" loading={loading}>
      <Table
        rowKey={(r) => r?.period || JSON.stringify(r)}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}
