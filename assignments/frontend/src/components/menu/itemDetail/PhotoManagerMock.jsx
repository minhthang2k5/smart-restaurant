import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Modal,
  Row,
  Space,
  Tag,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

function uid(prefix = "p") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export default function PhotoManagerMock({ photos = [], onChange }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const primary = useMemo(() => photos.find((p) => p.isPrimary), [photos]);

  const beforeUpload = (file) => {
    // UI validate (optional)
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      message.warning("Only JPG / PNG / WebP allowed");
      return Upload.LIST_IGNORE;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.warning("Max size 5MB");
      return Upload.LIST_IGNORE;
    }
    return false; // prevent auto upload
  };

  const handleUploadChange = ({ fileList }) => {
    const newFiles = fileList.map((f) => f.originFileObj).filter(Boolean);
    if (!newFiles.length) return;

    const newPhotos = newFiles.map((file) => ({
      id: uid("p"),
      url: URL.createObjectURL(file),
      isPrimary: false,
      name: file.name,
    }));

    let merged = [...photos, ...newPhotos];

    // If no primary yet, set first new one as primary
    if (!merged.some((p) => p.isPrimary) && merged.length > 0) {
      merged = merged.map((p, idx) => ({ ...p, isPrimary: idx === 0 }));
    }

    onChange?.(merged);
    message.success("Photos added (UI-only)");
  };

  const setPrimary = (photoId) => {
    const next = photos.map((p) => ({ ...p, isPrimary: p.id === photoId }));
    onChange?.(next);
    message.success("Set primary (UI-only)");
  };

  const remove = (photoId) => {
    let next = photos.filter((p) => p.id !== photoId);

    // If removed primary -> set first remaining as primary
    if (next.length > 0 && !next.some((p) => p.isPrimary)) {
      next = next.map((p, idx) => ({ ...p, isPrimary: idx === 0 }));
    }

    onChange?.(next);
    message.success("Deleted (UI-only)");
  };

  const openPreview = (url) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  return (
    <Card
      title="Photos"
      extra={
        <Space>
          <Upload
            multiple
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handleUploadChange}
          >
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>

          <Button
            disabled={!primary}
            onClick={() => primary && openPreview(primary.url)}
          >
            View Primary
          </Button>
        </Space>
      }
    >
      <Row gutter={[12, 12]}>
        {photos.length === 0 ? (
          <Col span={24}>
            <span style={{ color: "#888" }}>No photos yet. Upload some.</span>
          </Col>
        ) : (
          photos.map((p) => (
            <Col key={p.id} xs={12} md={8} lg={6}>
              <div
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fafafa",
                }}
              >
                <div
                  style={{
                    height: 120,
                    background: `url(${p.url}) center/cover`,
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => openPreview(p.url)}
                >
                  {p.isPrimary && (
                    <div style={{ position: "absolute", top: 8, left: 8 }}>
                      <Tag color="blue">PRIMARY</Tag>
                    </div>
                  )}
                </div>

                <div style={{ padding: 8 }}>
                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <Button size="small" onClick={() => setPrimary(p.id)}>
                      Set primary
                    </Button>
                    <Button size="small" danger onClick={() => remove(p.id)}>
                      Delete
                    </Button>
                  </Space>
                </div>
              </div>
            </Col>
          ))
        )}
      </Row>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        title="Preview"
      >
        <div
          style={{
            height: 360,
            borderRadius: 12,
            background: previewUrl
              ? `url(${previewUrl}) center/contain no-repeat`
              : "#f5f5f5",
          }}
        />
      </Modal>
    </Card>
  );
}
