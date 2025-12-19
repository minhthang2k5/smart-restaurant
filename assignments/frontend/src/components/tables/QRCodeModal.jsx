import { useState } from "react";
import {
  Modal,
  Button,
  Space,
  Divider,
  Switch,
  message,
  Spin,
  Alert,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  WifiOutlined,
  FilePdfOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import QRCode from "react-qr-code";
import tableService from "../../services/tableService";
import { downloadFile } from "../../utils/download";

const QRCodeModal = ({ open, onCancel, table, onRegenerate }) => {
  const [loading, setLoading] = useState(false);
  const [includeWifi, setIncludeWifi] = useState(false);
  const [qrData, setQrData] = useState(null);

  // Generate QR khi mở modal (nếu chưa có)
  const handleGenerate = async () => {
    if (!table) return;

    setLoading(true);
    try {
      const response = await tableService.generateQRCode(table.id);
      setQrData(response.data);
      message.success("QR Code generated successfully!");
    } catch (error) {
      message.error("Failed to generate QR code");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Regenerate QR
  const handleRegenerate = async () => {
    Modal.confirm({
      title: "Regenerate QR Code?",
      content:
        "The old QR code will no longer work. Any printed codes will become invalid.",
      okText: "Yes, Regenerate",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        await handleGenerate();
        onRegenerate?.(); // Callback để refresh table list
      },
    });
  };

  // Download PNG
  const handleDownloadPNG = async () => {
    if (!table) return;

    setLoading(true);
    try {
      const blob = await tableService.downloadQRCode(table.id, "png", false);
      downloadFile(blob, `table-${table.tableNumber}-qr.png`);
      message.success("QR Code downloaded as PNG");
    } catch (error) {
      message.error("Failed to download PNG");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!table) return;

    setLoading(true);
    try {
      const blob = await tableService.downloadQRCode(
        table.id,
        "pdf",
        includeWifi
      );
      downloadFile(blob, `table-${table.tableNumber}-qr.pdf`);
      message.success("QR Code downloaded as PDF");
    } catch (error) {
      message.error("Failed to download PDF");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Build QR URL (giống backend)
  const getQRUrl = () => {
    if (!qrData?.token) return "";
    const frontendUrl =
      import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    return `${frontendUrl}/menu?table=${table.id}&token=${qrData.token}`;
  };

  return (
    <Modal
      title={
        <Space>
          <span>QR Code for Table {table?.tableNumber}</span>
          {table?.qrToken && (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleRegenerate}
              danger
            >
              Regenerate
            </Button>
          )}
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Spin spinning={loading}>
        {/* QR Preview Section */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          {table?.qrToken || qrData ? (
            <>
              <div
                style={{
                  background: "white",
                  padding: 20,
                  borderRadius: 8,
                  display: "inline-block",
                  border: "1px solid #f0f0f0",
                }}
              >
                <QRCode
                  value={getQRUrl()}
                  size={256}
                  level="H" // High error correction
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>

              <div style={{ marginTop: 16, fontSize: 12, color: "#666" }}>
                <div>
                  Created:{" "}
                  {new Date(
                    qrData?.createdAt || table.qrTokenCreatedAt
                  ).toLocaleString()}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    wordBreak: "break-all",
                    maxWidth: 500,
                    margin: "4px auto 0",
                  }}
                >
                  URL: {getQRUrl()}
                </div>
              </div>
            </>
          ) : (
            <Alert
              message="No QR Code Generated"
              description="Click the button below to generate a QR code for this table."
              type="info"
              showIcon
            />
          )}
        </div>

        <Divider />

        {/* Download Options */}
        <div>
          <h4 style={{ marginBottom: 16 }}>Download Options</h4>

          {/* WiFi Toggle */}
          <div style={{ marginBottom: 16 }}>
            <Space>
              <WifiOutlined />
              <span>Include WiFi Information in PDF:</span>
              <Switch checked={includeWifi} onChange={setIncludeWifi} />
            </Space>
          </div>

          {/* Download Buttons */}
          <Space
            size="middle"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {table?.qrToken || qrData ? (
              <>
                <Button
                  type="primary"
                  icon={<FileImageOutlined />}
                  onClick={handleDownloadPNG}
                  size="large"
                >
                  Download PNG
                </Button>

                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={handleDownloadPDF}
                  size="large"
                  ghost
                >
                  Download PDF
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleGenerate}
                size="large"
              >
                Generate QR Code
              </Button>
            )}
          </Space>
        </div>

        {/* Table Info */}
        <Divider />
        <div style={{ fontSize: 12, color: "#666" }}>
          <div>
            <strong>Location:</strong> {table?.location}
          </div>
          <div>
            <strong>Capacity:</strong> {table?.capacity} people
          </div>
          {table?.description && (
            <div>
              <strong>Note:</strong> {table.description}
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default QRCodeModal;
