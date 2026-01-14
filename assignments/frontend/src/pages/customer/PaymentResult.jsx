import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Result, Spin, Typography, message } from "antd";
import * as paymentService from "../../services/paymentService";
import * as cartService from "../../services/cartService";

const { Paragraph, Text } = Typography;

const MOMO_STORAGE_PREFIX = "momoPayment:";

const clearStoredMoMo = (sessionId) => {
  if (!sessionId) return;
  localStorage.removeItem(`${MOMO_STORAGE_PREFIX}${sessionId}`);
};

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const decodeExtraData = (extraDataBase64) => {
  if (!extraDataBase64) return null;
  try {
    const decoded = atob(extraDataBase64);
    return safeJsonParse(decoded);
  } catch {
    return null;
  }
};

export default function PaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const callbackData = useMemo(() => Object.fromEntries(query.entries()), [query]);

  const extra = useMemo(
    () => decodeExtraData(callbackData.extraData),
    [callbackData.extraData]
  );

  const sessionId = extra?.sessionId || localStorage.getItem("sessionId");

  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  // Fallback: POST redirect params to backend callback endpoint.
  // This helps when IPN is blocked/missed; backend verifies signature and is idempotent.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Only call if we have a signature and required fields.
        if (callbackData?.signature && callbackData?.requestId) {
          await paymentService.processMoMoCallback(callbackData);
        }
      } catch (e) {
        // Not fatal; polling status may still succeed.
        if (!cancelled) console.error(e);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [callbackData]);

  // Poll backend payment status until terminal.
  useEffect(() => {
    if (!sessionId) return;

    let stopped = false;
    let intervalId;

    const tick = async () => {
      try {
        const res = await paymentService.getPaymentStatus(sessionId);
        const payload = res?.data || res;
        const next = payload?.data || payload;

        if (stopped) return;
        setStatus(next);
        setError(null);

        const paymentStatus = next?.payment_status;
        if (paymentStatus === "paid") {
          stopped = true;
          window.clearInterval(intervalId);

          message.success("Payment completed successfully");
          clearStoredMoMo(sessionId);
          localStorage.removeItem("sessionId");
          cartService.clearLocalCart();
          return;
        }

        if (paymentStatus === "failed" || paymentStatus === "cancelled" || paymentStatus === "canceled") {
          window.clearInterval(intervalId);
        } else {
          // keep polling
        }
      } catch (e) {
        if (stopped) return;
        setError(e?.response?.data?.message || "Failed to check payment status");
        console.error(e);
      }
    };

    tick();
    intervalId = window.setInterval(tick, 2000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [sessionId]);

  const isLoading = !!sessionId && !status && !error;

  const qsResultCode = callbackData?.resultCode;
  const qsMessage = callbackData?.message;
  const qsTransId = callbackData?.transId;

  const paymentStatus = status?.payment_status;
  const isPaid = paymentStatus === "paid";
  const isFailed = paymentStatus === "failed";
  const isCancelled = paymentStatus === "cancelled" || paymentStatus === "canceled";

  const resultProps = (() => {
    if (isPaid) {
      return {
        status: "success",
        title: "Payment successful",
        subTitle: "Your bill has been paid. You can return to the menu.",
      };
    }

    if (isFailed) {
      return {
        status: "error",
        title: "Payment failed",
        subTitle: "Please try again or choose another payment method.",
      };
    }

    if (isCancelled) {
      return {
        status: "warning",
        title: "Payment cancelled",
        subTitle: "You can retry payment from Orders.",
      };
    }

    if (qsResultCode === "0") {
      return {
        status: "info",
        title: "Payment submitted",
        subTitle: "MoMo returned success. Waiting for the system to confirm...",
      };
    }

    return {
      status: "info",
      title: "Processing payment",
      subTitle: "Please wait while we confirm your payment status...",
    };
  })();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "24px 0" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
        <Card>
          <Spin spinning={isLoading}>
            <Result
              status={resultProps.status}
              title={resultProps.title}
              subTitle={resultProps.subTitle}
              extra={[
                <Button key="orders" type="primary" onClick={() => navigate("/orders")}
                >
                  Back to Orders
                </Button>,
                <Button key="menu" onClick={() => navigate("/menu")}>Back to Menu</Button>,
              ]}
            />

            {!sessionId ? (
              <Alert
                type="error"
                showIcon
                message="Missing sessionId. Please return to Orders and refresh."
                style={{ marginTop: 12 }}
              />
            ) : null}

            {error ? (
              <Alert type="error" showIcon message={error} style={{ marginTop: 12 }} />
            ) : null}

            <div style={{ marginTop: 12 }}>
              <Paragraph>
                <Text strong>Session:</Text> <Text>{sessionId || "(unknown)"}</Text>
              </Paragraph>
              {paymentStatus ? (
                <Paragraph>
                  <Text strong>Backend status:</Text> <Text>{String(paymentStatus).toUpperCase()}</Text>
                </Paragraph>
              ) : null}
              {qsResultCode != null ? (
                <Paragraph>
                  <Text strong>MoMo resultCode:</Text> <Text>{String(qsResultCode)}</Text>
                </Paragraph>
              ) : null}
              {qsMessage ? (
                <Paragraph>
                  <Text strong>MoMo message:</Text> <Text>{String(qsMessage)}</Text>
                </Paragraph>
              ) : null}
              {qsTransId ? (
                <Paragraph>
                  <Text strong>MoMo transId:</Text> <Text>{String(qsTransId)}</Text>
                </Paragraph>
              ) : null}
            </div>

            {!isPaid ? (
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button
                  onClick={() => {
                    // Quick retry: simply re-run the page to re-post callback + poll
                    window.location.reload();
                  }}
                >
                  Refresh Status
                </Button>
              </div>
            ) : null}
          </Spin>
        </Card>
      </div>
    </div>
  );
}
