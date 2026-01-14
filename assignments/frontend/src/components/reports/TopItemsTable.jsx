import { Card, Image, Table, Typography } from "antd";
import { formatMoney, formatNumber } from "../../utils/format";

const getAssetBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

const toAbsoluteImageUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = getAssetBaseUrl();
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
};

export default function TopItemsTable({ items, loading }) {
  const data = Array.isArray(items) ? items : [];

  const rankBadgeStyle = (rank) => {
    const base = {
      display: "inline-flex",
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      fontWeight: 800,
      fontSize: 12,
    };

    if (rank === 1)
      return {
        ...base,
        background: "rgba(245, 158, 11, 0.18)",
        color: "#b45309",
      };
    if (rank === 2)
      return {
        ...base,
        background: "rgba(148, 163, 184, 0.25)",
        color: "#475569",
      };
    if (rank === 3)
      return {
        ...base,
        background: "rgba(234, 88, 12, 0.14)",
        color: "#9a3412",
      };
    return {
      ...base,
      background: "rgba(139, 92, 246, 0.12)",
      color: "#6d28d9",
    };
  };

  const columns = [
    {
      title: "#",
      dataIndex: "rank",
      key: "rank",
      width: 60,
      render: (rank) => (
        <span style={rankBadgeStyle(Number(rank))}>{rank ?? "—"}</span>
      ),
    },
    {
      title: "Item",
      key: "item",
      render: (_, record) => {
        const imageUrl = toAbsoluteImageUrl(record?.imageUrl);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image
              width={48}
              height={48}
              src={imageUrl || undefined}
              style={{ objectFit: "cover", borderRadius: 8 }}
              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23f3f4f6'/%3E%3C/svg%3E"
              preview={Boolean(imageUrl)}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Typography.Text strong>{record?.name || "—"}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record?.categoryName || "—"}
              </Typography.Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "Qty Sold",
      dataIndex: "quantitySold",
      key: "quantitySold",
      width: 110,
      render: (v) => formatNumber(v),
    },
    {
      title: "Order Count",
      dataIndex: "orderCount",
      key: "orderCount",
      width: 110,
      render: (v) => formatNumber(v),
    },
    {
      title: "Avg Price",
      dataIndex: "avgPrice",
      key: "avgPrice",
      width: 110,
      render: (v) => formatMoney(v),
    },
    {
      title: "Revenue",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      width: 120,
      render: (v) => formatMoney(v),
    },
  ];

  return (
    <Card title="Top Selling Items" loading={loading}>
      <Table
        rowKey={(r) =>
          r?.menuItemId || r?.name || String(r?.rank || Math.random())
        }
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}
