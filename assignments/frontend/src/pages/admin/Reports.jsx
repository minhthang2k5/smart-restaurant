import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Space, Tabs, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import ReportFilters from "../../components/reports/ReportFilters";
import RevenueSummaryCards from "../../components/reports/RevenueSummaryCards";
import RevenueLineChart from "../../components/reports/RevenueLineChart";
import RevenueDataTable from "../../components/reports/RevenueDataTable";
import TopItemsTable from "../../components/reports/TopItemsTable";
import ChartPanels from "../../components/reports/ChartPanels";
import * as reportService from "../../services/reportService";
import "../../styles/Reports.css";

const toIsoOrNull = (dayjsValue) => {
  if (!dayjsValue) return null;
  try {
    return dayjsValue.toISOString();
  } catch {
    return null;
  }
};

const buildParams = ({ period, range, granularity, limit }) => {
  const params = {};

  if (period === "custom") {
    const startDate = toIsoOrNull(range?.[0]);
    const endDate = toIsoOrNull(range?.[1]);
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
  } else if (period) {
    params.period = period;
  }

  if (granularity) params.granularity = granularity;
  if (limit) params.limit = limit;

  return params;
};

export default function Reports() {
  const [filters, setFilters] = useState({
    period: "7days",
    range: null,
    granularity: "daily",
    limit: 10,
  });

  const [loading, setLoading] = useState({
    revenue: false,
    topItems: false,
    charts: false,
  });

  const [revenue, setRevenue] = useState(null);
  const [topItems, setTopItems] = useState(null);
  const [chartData, setChartData] = useState(null);

  const query = useMemo(() => buildParams(filters), [filters]);

  const fetchAll = useCallback(async () => {
    const isCustom = filters.period === "custom";
    if (isCustom && (!filters.range?.[0] || !filters.range?.[1])) {
      message.warning("Please select a valid custom date range");
      return;
    }

    setLoading({ revenue: true, topItems: true, charts: true });

    try {
      const [rev, top, charts] = await Promise.all([
        reportService.getRevenueReport({
          period: query.period,
          startDate: query.startDate,
          endDate: query.endDate,
          granularity: query.granularity,
        }),
        reportService.getTopItemsReport({
          period: query.period,
          startDate: query.startDate,
          endDate: query.endDate,
          limit: query.limit,
        }),
        reportService.getChartDataReport({
          period: query.period,
          startDate: query.startDate,
          endDate: query.endDate,
        }),
      ]);

      setRevenue(rev?.data || null);
      setTopItems(top?.data || null);
      setChartData(charts?.data || null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load reports");
      console.error(err);
    } finally {
      setLoading({ revenue: false, topItems: false, charts: false });
    }
  }, [filters.period, filters.range, query]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const tabItems = [
    {
      key: "revenue",
      label: "Revenue",
      children: (
        <>
          <RevenueSummaryCards
            summary={revenue?.summary}
            loading={loading.revenue}
          />
          <RevenueLineChart
            dataPoints={revenue?.dataPoints}
            loading={loading.revenue}
          />
          <RevenueDataTable
            dataPoints={revenue?.dataPoints}
            loading={loading.revenue}
          />
        </>
      ),
    },
    {
      key: "top-items",
      label: "Top Items",
      children: (
        <TopItemsTable items={topItems?.items} loading={loading.topItems} />
      ),
    },
    {
      key: "charts",
      label: "Charts",
      children: (
        <ChartPanels charts={chartData?.charts} loading={loading.charts} />
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        className="reportsHeaderCard"
        style={{ marginBottom: 16 }}
        styles={{ body: { padding: 20 } }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Reports & Analytics
            </Typography.Title>
            <Typography.Text type="secondary">
              Track your restaurant's performance
            </Typography.Text>
          </div>

          <Space className="reportsHeaderActions">
            <Button icon={<ReloadOutlined />} onClick={fetchAll}>
              Refresh
            </Button>
          </Space>
        </div>
      </Card>

      <ReportFilters value={filters} onChange={setFilters} />

      <Tabs
        className="reportsTabs"
        defaultActiveKey="revenue"
        items={tabItems}
      />
    </div>
  );
}
