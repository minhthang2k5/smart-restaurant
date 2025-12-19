import { useState } from "react";
import { Button, Dropdown, message, Modal } from "antd";
import {
  DownloadOutlined,
  FileZipOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import tableService from "../../services/tableService";
import { downloadFile } from "../../utils/download";

const BulkDownloadButton = ({ tableCount }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (format) => {
    if (tableCount === 0) {
      message.warning("No tables available to download");
      return;
    }

    Modal.confirm({
      title: `Download All QR Codes as ${format.toUpperCase()}?`,
      content: `This will download QR codes for all ${tableCount} active tables.`,
      okText: "Download",
      cancelText: "Cancel",
      onOk: async () => {
        setLoading(true);
        try {
          const blob = await tableService.downloadAllQRCodes(format);
          const filename =
            format === "zip"
              ? `all-tables-qr-codes.zip`
              : `all-tables-qr-codes.pdf`;
          downloadFile(blob, filename);
          message.success(`Successfully downloaded ${tableCount} QR codes`);
        } catch (error) {
          message.error(`Failed to download ${format.toUpperCase()}`);
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const menuItems = [
    {
      key: "zip",
      icon: <FileZipOutlined />,
      label: "Download as ZIP (Multiple PNG)",
      onClick: () => handleDownload("zip"),
    },
    {
      key: "pdf",
      icon: <FilePdfOutlined />,
      label: "Download as PDF (Single File)",
      onClick: () => handleDownload("pdf"),
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        loading={loading}
        disabled={tableCount === 0}
      >
        Download All QR Codes
      </Button>
    </Dropdown>
  );
};

export default BulkDownloadButton;
