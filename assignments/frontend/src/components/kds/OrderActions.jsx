import { Button, Tooltip } from "antd";
import { LANE } from "./constants.jsx";

function OrderActions({ lane, order, onStartCooking, onMarkReady }) {
  if (lane === LANE.received) {
    if (order?.status === "accepted") {
      return (
        <Button
          type="primary"
          style={{ flex: 1 }}
          onClick={() => onStartCooking(order)}
        >
          🍳 Start Cooking
        </Button>
      );
    }

    return (
      <Tooltip title="Only Admin/Waiter can accept orders">
        <Button style={{ flex: 1 }} disabled>
          Waiting for acceptance
        </Button>
      </Tooltip>
    );
  }

  if (lane === LANE.preparing) {
    return (
      <Button
        type="primary"
        style={{ flex: 1 }}
        onClick={() => onMarkReady(order)}
      >
        ✓ Mark Ready
      </Button>
    );
  }

  if (lane === LANE.ready) {
    return (
      <Tooltip title="This order will disappear after Admin/Waiter completes it">
        <Button style={{ flex: 1 }} disabled>
          Waiting for pickup
        </Button>
      </Tooltip>
    );
  }

  return null;
}

export default OrderActions;
