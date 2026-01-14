import { Card, Col, Row } from "antd";
import {
  DollarCircleOutlined,
  ShoppingCartOutlined,
  FundOutlined,
} from "@ant-design/icons";
import { formatMoney, formatNumber } from "../../utils/format";

export default function RevenueSummaryCards({ summary, loading }) {
  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const avgOrderValue = summary?.avgOrderValue ?? 0;

  const cards = [
    {
      title: "Total Revenue",
      value: formatMoney(totalRevenue),
      icon: <DollarCircleOutlined style={{ fontSize: 22, color: "#16a34a" }} />,
      iconBg: "rgba(34, 197, 94, 0.12)",
    },
    {
      title: "Total Orders",
      value: formatNumber(totalOrders),
      icon: <ShoppingCartOutlined style={{ fontSize: 22, color: "#2563eb" }} />,
      iconBg: "rgba(59, 130, 246, 0.12)",
    },
    {
      title: "Avg. Order Value",
      value: formatMoney(avgOrderValue),
      icon: <FundOutlined style={{ fontSize: 22, color: "#f59e0b" }} />,
      iconBg: "rgba(245, 158, 11, 0.14)",
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      {cards.map((c) => (
        <Col key={c.title} xs={24} md={8}>
          <Card
            loading={loading}
            className="reportsStatCard"
            styles={{ body: { padding: 18 } }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div className="reportsStatIcon" style={{ background: c.iconBg }}>
                {c.icon}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <div className="reportsStatValue">{c.value}</div>
                <div className="reportsStatLabel">{c.title}</div>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
