import { Alert, List, Typography } from "antd";
import PropTypes from "prop-types";
import { formatVND } from "../../../utils/currency";

const { Title, Text } = Typography;

/**
 * Bill Items List Component
 * Displays ordered items with modifiers
 */
export default function BillItemsList({ items }) {
  return (
    <>
      <Title level={4}>Order Items</Title>
      {items && items.length > 0 ? (
        <List
          dataSource={items}
          renderItem={(item) => (
            <List.Item>
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text strong>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text strong>{formatVND(item.totalPrice)}</Text>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div style={{ paddingLeft: 16, color: "#666" }}>
                    {item.modifiers.map((mod, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 12,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>+ {mod.name}</span>
                        {mod.priceAdjustment > 0 && (
                          <span>+{formatVND(mod.priceAdjustment)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Alert type="info" showIcon message="No items in this session" />
      )}
    </>
  );
}

BillItemsList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      quantity: PropTypes.number,
      totalPrice: PropTypes.number,
      modifiers: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
          priceAdjustment: PropTypes.number,
        })
      ),
    })
  ),
};

BillItemsList.defaultProps = {
  items: [],
};
