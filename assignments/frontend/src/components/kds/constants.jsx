import {
  BellOutlined,
  CheckCircleOutlined,
  FireOutlined,
} from "@ant-design/icons";

export const OVERDUE_MINUTES = 15;
export const WARNING_MINUTES = 10;

export const LANE = {
  received: "received",
  preparing: "preparing",
  ready: "ready",
};

export const laneMeta = {
  received: {
    title: "Received",
    icon: <BellOutlined />,
    color: "gold",
    border: "#f59e0b",
  },
  preparing: {
    title: "Preparing",
    icon: <FireOutlined />,
    color: "processing",
    border: "#1890ff",
  },
  ready: {
    title: "Ready",
    icon: <CheckCircleOutlined />,
    color: "green",
    border: "#52c41a",
  },
};
