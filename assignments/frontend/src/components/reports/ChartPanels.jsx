import { Card, Col, Empty, Row } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatNumber } from "../../utils/format";

const PIE_COLORS = [
  "#EC4899",
  "#8B5CF6",
  "#22C55E",
  "#F59E0B",
  "#06B6D4",
  "#EF4444",
  "#A855F7",
  "#10B981",
  "#3B82F6",
  "#F97316",
];

export default function ChartPanels({ charts, loading }) {
  const ordersPerDay = Array.isArray(charts?.ordersPerDay)
    ? charts.ordersPerDay
    : [];
  const peakHours = Array.isArray(charts?.peakHours) ? charts.peakHours : [];
  const popularItems = Array.isArray(charts?.popularItems)
    ? charts.popularItems
    : [];

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Orders & Revenue per Day" loading={loading}>
          {ordersPerDay.length === 0 ? (
            <Empty description="No chart data" />
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart
                  data={ordersPerDay}
                  margin={{ top: 12, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" tickFormatter={(v) => String(v)} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => formatMoney(v).replace("$", "")}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "revenue")
                        return [formatMoney(value), "Revenue"];
                      if (name === "orderCount")
                        return [formatNumber(value), "Orders"];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="orderCount"
                    name="Orders"
                    fill="#8B5CF6"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="revenue"
                    name="Revenue"
                    fill="#EC4899"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="Peak Hours" loading={loading}>
          {peakHours.length === 0 ? (
            <Empty description="No chart data" />
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart
                  data={peakHours}
                  margin={{ top: 12, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(v) => String(v)} />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "revenue")
                        return [formatMoney(value), "Revenue"];
                      if (name === "orderCount")
                        return [formatNumber(value), "Orders"];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="orderCount" name="Orders" fill="#3B82F6" />
                  <Bar dataKey="revenue" name="Revenue" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Popular Items" loading={loading}>
          {popularItems.length === 0 ? (
            <Empty description="No chart data" />
          ) : (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip
                    formatter={(value, name, props) => {
                      const label = props?.payload?.name || name;
                      return [formatMoney(value), label];
                    }}
                  />
                  <Legend />
                  <Pie
                    data={popularItems}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {popularItems.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
}
