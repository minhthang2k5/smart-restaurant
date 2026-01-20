import { Descriptions, Tag } from "antd";
import PropTypes from "prop-types";

/**
 * Bill Session Information Component
 * Displays table, session, and timing details
 */
export default function BillSessionInfo({ billData, formatDate }) {
  return (
    <Descriptions bordered column={2} size="small">
      <Descriptions.Item label="Table">{billData.tableNumber}</Descriptions.Item>
      <Descriptions.Item label="Location">
        {billData.location || "N/A"}
      </Descriptions.Item>
      <Descriptions.Item label="Session">
        {billData.sessionNumber}
      </Descriptions.Item>
      <Descriptions.Item label="Status">
        <Tag color={billData.status === "active" ? "green" : "default"}>
          {String(billData.status || "unknown").toUpperCase()}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Started At">
        {formatDate(billData.startedAt)}
      </Descriptions.Item>
      <Descriptions.Item label="Requested At">
        {formatDate(billData.billRequestedAt)}
      </Descriptions.Item>
    </Descriptions>
  );
}

BillSessionInfo.propTypes = {
  billData: PropTypes.shape({
    tableNumber: PropTypes.string,
    location: PropTypes.string,
    sessionNumber: PropTypes.string,
    status: PropTypes.string,
    startedAt: PropTypes.string,
    billRequestedAt: PropTypes.string,
  }).isRequired,
  formatDate: PropTypes.func.isRequired,
};
