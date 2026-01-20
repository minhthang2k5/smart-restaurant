import { Button } from "antd";
import { DownloadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

/**
 * Bill Actions Component
 * Download PDF and Clear Request buttons
 */
export default function BillActions({ onDownloadPDF, onClearRequest, clearing }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={onDownloadPDF}
      >
        Download PDF
      </Button>
      <Button
        icon={<CheckCircleOutlined />}
        onClick={onClearRequest}
        loading={clearing}
      >
        Clear Request
      </Button>
    </div>
  );
}

BillActions.propTypes = {
  onDownloadPDF: PropTypes.func.isRequired,
  onClearRequest: PropTypes.func.isRequired,
  clearing: PropTypes.bool,
};

BillActions.defaultProps = {
  clearing: false,
};
