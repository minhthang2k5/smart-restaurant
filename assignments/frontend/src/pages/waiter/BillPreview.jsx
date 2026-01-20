import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Divider, message, Spin, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

import * as billService from "../../services/billService";
import { generateBillPdf } from "../../utils/billPdfGenerator";

import BillSessionInfo from "./bill/BillSessionInfo";
import BillItemsList from "./bill/BillItemsList";
import BillTotals from "./bill/BillTotals";
import BillActions from "./bill/BillActions";

const { Title } = Typography;

/**
 * Bill Preview Page
 * Main component that orchestrates bill preview functionality
 */
export default function BillPreview() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [billData, setBillData] = useState(null);
  const [clearing, setClearing] = useState(false);

  // Load bill data from API
  const loadBillData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await billService.getBillPreview(sessionId);
      const data = res?.data || res;
      setBillData(data);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to load bill preview"
      );
      console.error("Load bill error:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadBillData();
    }
  }, [sessionId, loadBillData]);

  // Handle clearing bill request
  const handleClearRequest = async () => {
    try {
      setClearing(true);
      await billService.clearBillRequest(sessionId);
      message.success("Bill request cleared");
      navigate("/admin/bill-requests");
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to clear bill request"
      );
      console.error("Clear request error:", error);
    } finally {
      setClearing(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      const fileName = await generateBillPdf(billData);
      message.success(`PDF downloaded: ${fileName}`);
    } catch (error) {
      message.error("Failed to generate PDF");
      console.error("PDF generation error:", error);
    }
  };

  // Format date helper
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Navigate back
  const handleGoBack = () => {
    navigate("/admin/bill-requests");
  };

  // ==================== RENDER STATES ====================

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" tip="Loading bill..." />
      </div>
    );
  }

  // Error state - no data
  if (!billData) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: 24 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Alert
            type="error"
            showIcon
            message="Failed to load bill data"
            description="The bill preview could not be loaded. Please go back and try again."
            action={
              <Button onClick={handleGoBack}>Back to Requests</Button>
            }
          />
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleGoBack}
          style={{ marginBottom: 16 }}
        >
          Back to Requests
        </Button>

        {/* Main Card */}
        <Card
          title={
            <Title level={3} style={{ margin: 0 }}>
              Bill Preview - Table {billData.tableNumber}
            </Title>
          }
          extra={
            <BillActions
              onDownloadPDF={handleDownloadPDF}
              onClearRequest={handleClearRequest}
              clearing={clearing}
            />
          }
        >
          {/* Bill Requested Alert */}
          {billData.billRequestedAt && (
            <Alert
              type="info"
              showIcon
              message={`Bill requested on ${formatDate(billData.billRequestedAt)}`}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Session Information */}
          <BillSessionInfo billData={billData} formatDate={formatDate} />

          <Divider />

          {/* Order Items */}
          <BillItemsList items={billData.items} />

          <Divider />

          {/* Totals */}
          <BillTotals
            subtotal={billData.subtotal}
            taxAmount={billData.taxAmount}
            discountAmount={billData.discountAmount}
            totalAmount={billData.totalAmount}
          />
        </Card>
      </div>
    </div>
  );
}
