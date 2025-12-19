import { Card, Row, Col, Statistic } from "antd";
import {
  TableOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import tableService from "../../services/tableService";

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withQR: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await tableService.getAllTables();
      const tables = response.data || [];

      setStats({
        total: tables.length,
        active: tables.filter((t) => t.status === "active").length,
        inactive: tables.filter((t) => t.status === "inactive").length,
        withQR: tables.filter((t) => t.qrToken).length,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Tables"
              value={stats.total}
              prefix={<TableOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Active Tables"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Inactive Tables"
              value={stats.inactive}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="QR Codes Generated"
              value={stats.withQR}
              prefix={<QrcodeOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
