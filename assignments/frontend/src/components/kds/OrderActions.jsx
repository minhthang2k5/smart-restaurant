import { Button, Tooltip } from "antd";
import { LANE } from "./constants.jsx";

function OrderActions({ lane, order, onAcceptStart, onMarkReady, onBump }) {
  if (lane === LANE.received) {
    return (
      <Button
        type="primary"
        style={{ flex: 1 }}
        onClick={() => onAcceptStart(order)}
      >
        ✓ Accept & Start
      </Button>
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
      <>
        <Button
          type="primary"
          style={{ flex: 1 }}
          onClick={() => onBump(order)}
        >
          👍 Bump
        </Button>
        <Tooltip title="Recall is not supported by the current status transitions">
          <Button style={{ flex: 1 }} disabled>
            Recall
          </Button>
        </Tooltip>
      </>
    );
  }

  return null;
}

export default OrderActions;
