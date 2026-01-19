import { Card, Empty } from "antd";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "../../utils/format";

export default function RevenueLineChart({ dataPoints, loading }) {
  const data = Array.isArray(dataPoints) ? dataPoints : [];

  return (
    <Card title="Revenue Trend" loading={loading} style={{ marginBottom: 16 }}>
      {data.length === 0 ? (
        <Empty description="No revenue data" />
      ) : (
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{ top: 12, right: 24, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" tickFormatter={(v) => String(v)} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => formatMoney(v)}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "totalRevenue")
                    return [formatMoney(value), "Revenue"];
                  return [value, name === "orderCount" ? "Orders" : name];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="orderCount"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
                name="orderCount"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalRevenue"
                stroke="#EC4899"
                strokeWidth={2}
                dot={false}
                name="totalRevenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
