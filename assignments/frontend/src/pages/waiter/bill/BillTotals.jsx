import { Divider, Typography } from "antd";
import PropTypes from "prop-types";
import { formatVND } from "../../../utils/currency";

const { Title, Text } = Typography;

/**
 * Bill Totals Component
 * Displays subtotal, tax, discount, and total
 */
export default function BillTotals({ subtotal, taxAmount, discountAmount, totalAmount }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "16px 0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Text>Subtotal:</Text>
        <Text strong>{formatVND(subtotal || 0)}</Text>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Text>Tax (10%):</Text>
        <Text strong>{formatVND(taxAmount || 0)}</Text>
      </div>
      {discountAmount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text>Discount:</Text>
          <Text strong style={{ color: "#52c41a" }}>
            -{formatVND(discountAmount)}
          </Text>
        </div>
      )}
      <Divider style={{ margin: "8px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Title level={4} style={{ margin: 0 }}>
          Total:
        </Title>
        <Title level={4} style={{ margin: 0, color: "#52c41a" }}>
          {formatVND(totalAmount || 0)}
        </Title>
      </div>
    </div>
  );
}

BillTotals.propTypes = {
  subtotal: PropTypes.number,
  taxAmount: PropTypes.number,
  discountAmount: PropTypes.number,
  totalAmount: PropTypes.number,
};

BillTotals.defaultProps = {
  subtotal: 0,
  taxAmount: 0,
  discountAmount: 0,
  totalAmount: 0,
};
