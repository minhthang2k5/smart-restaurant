import {
  ClockCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { Button, Card, message, Space, Switch, Tag, Typography } from "antd";

export function KDSHeader({
  headerClock,
  soundOn,
  setSoundOn,
  loading,
  onRefresh,
  onBack,
}) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Kitchen Display
          </Typography.Title>
          <Typography.Text type="secondary">
            Track kitchen workflow in real time
          </Typography.Text>
        </div>

        <Space wrap>
          <Tag icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
            {headerClock}
          </Tag>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Tag
              icon={<SoundOutlined />}
              color={soundOn ? "green" : "default"}
              style={{ margin: 0 }}
            >
              {soundOn ? "Sound ON" : "Sound OFF"}
            </Tag>
            <Switch size="small" checked={soundOn} onChange={setSoundOn} />
          </div>

          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => message.info("Settings coming soon")}
          >
            Settings
          </Button>
          <Button onClick={onBack}>Back to Orders</Button>
        </Space>
      </div>
    </Card>
  );
}
