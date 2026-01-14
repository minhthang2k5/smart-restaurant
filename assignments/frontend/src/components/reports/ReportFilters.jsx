import { Card, DatePicker, Select, Space, Typography } from "antd";

const { RangePicker } = DatePicker;

export const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7days", label: "Last 7 days" },
  { value: "30days", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom", label: "Custom range" },
];

const GRANULARITY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const LIMIT_OPTIONS = [
  { value: 5, label: "Top 5" },
  { value: 10, label: "Top 10" },
  { value: 20, label: "Top 20" },
  { value: 50, label: "Top 50" },
];

export default function ReportFilters({ value, onChange }) {
  const period = value?.period ?? "7days";
  const range = value?.range ?? null;
  const granularity = value?.granularity ?? "daily";
  const limit = value?.limit ?? 10;

  const update = (patch) => {
    onChange?.({
      period,
      range,
      granularity,
      limit,
      ...value,
      ...patch,
    });
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Report Filters
          </Typography.Title>
          <Typography.Text type="secondary">
            Use period filters or a custom date range.
          </Typography.Text>
        </div>

        <Space wrap>
          <Select
            value={period}
            onChange={(v) => update({ period: v })}
            options={PERIOD_OPTIONS}
            style={{ width: 180 }}
          />

          <RangePicker
            value={range}
            onChange={(v) => update({ range: v })}
            disabled={period !== "custom"}
            allowClear
          />

          <Select
            value={granularity}
            onChange={(v) => update({ granularity: v })}
            options={GRANULARITY_OPTIONS}
            style={{ width: 140 }}
          />

          <Select
            value={limit}
            onChange={(v) => update({ limit: v })}
            options={LIMIT_OPTIONS}
            style={{ width: 120 }}
          />
        </Space>
      </div>
    </Card>
  );
}
