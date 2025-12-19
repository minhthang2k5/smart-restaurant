import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Result, Spin, Alert } from "antd";
import { QrcodeOutlined, CheckCircleOutlined } from "@ant-design/icons";

const Menu = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [tableInfo, setTableInfo] = useState(null);
  const [error, setError] = useState(null);

  const tableId = searchParams.get("table");
  const token = searchParams.get("token");

  useEffect(() => {
    verifyQRToken();
  }, [tableId, token]);

  const verifyQRToken = async () => {
    setLoading(true);
    setError(null);

    if (!tableId || !token) {
      setError("Invalid QR code. Missing table or token parameter.");
      setLoading(false);
      return;
    }

    try {
      // TODO: Call API to verify token
      // const response = await tableService.verifyQRToken(tableId, token);

      // Mock verification
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setVerified(true);
      setTableInfo({
        tableNumber: "T-01",
        location: "Main Hall",
        capacity: 4,
      });
    } catch (err) {
      setError(err.message || "Failed to verify QR token");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Spin size="large" />
        <p>Verifying QR code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: 24,
        }}
      >
        <Result
          status="error"
          title="Invalid QR Code"
          subTitle={error}
          icon={<QrcodeOutlined />}
        />
      </div>
    );
  }

  if (!verified) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: 24,
        }}
      >
        <Result
          status="warning"
          title="Verification Required"
          subTitle="Please scan a valid QR code to access the menu."
        />
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 24,
        minHeight: "100vh",
      }}
    >
      {/* Success Banner */}
      <Alert
        message={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircleOutlined />
            <span>
              Welcome to Table {tableInfo.tableNumber} ({tableInfo.location})
            </span>
          </div>
        }
        type="success"
        showIcon={false}
        style={{ marginBottom: 24 }}
      />

      {/* Menu Content */}
      <Card>
        <Result
          status="info"
          title="Menu Coming Soon"
          subTitle={
            <div>
              <p>This is a placeholder for the customer menu page.</p>
              <p>
                Table: <strong>{tableInfo.tableNumber}</strong>
              </p>
              <p>
                Location: <strong>{tableInfo.location}</strong>
              </p>
              <p>
                Capacity: <strong>{tableInfo.capacity} people</strong>
              </p>
            </div>
          }
        />

        {/* TODO: Add menu items, cart, checkout flow */}
      </Card>
    </div>
  );
};

export default Menu;
