import { useState } from "react";
import { Button, Space, Input, Select, Card } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import TableList from "../../components/tables/TableList";
import TableForm from "../../components/tables/TableForm";
import QRCodeModal from "../../components/tables/QRCodeModal";
import DownloadButtons from "../../components/tables/DownloadButtons"; // ← Updated import
import { useTables } from "../../hooks/useTables";

const { Option } = Select;

const Tables = () => {
  const {
    tables,
    loading,
    filters,
    setFilters,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    toggleStatus,
  } = useTables();

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  // ========== Table Form Handlers ==========
  const handleCreate = () => {
    setSelectedTable(null);
    setFormOpen(true);
  };

  const handleEdit = (table) => {
    setSelectedTable(table);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values) => {
    if (selectedTable) {
      return await updateTable(selectedTable.id, values);
    } else {
      return await createTable(values);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedTable(null);
  };

  // ========== QR Modal Handlers ==========
  const handleGenerateQR = (table) => {
    setSelectedTable(table);
    setQrModalOpen(true);
  };

  const handleQrModalClose = () => {
    setQrModalOpen(false);
    setSelectedTable(null);
  };

  const handleQrRegenerate = () => {
    fetchTables();
  };

  // ========== Filter Handlers ==========
  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
  };

  const handleStatusFilter = (value) => {
    setFilters({ ...filters, status: value });
  };

  const handleLocationFilter = (value) => {
    setFilters({ ...filters, location: value });
  };

  return (
    <div>
      {/* Header Section */}
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>Table Management</h2>
          <Space>
            <DownloadButtons tableCount={tables.length} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Add New Table
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <Space style={{ marginTop: 16, width: "100%" }} size="middle" wrap>
          <Input
            placeholder="Search table number..."
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
            onChange={(e) => handleSearch(e.target.value)}
          />

          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            allowClear
            onChange={handleStatusFilter}
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>

          <Select
            placeholder="Filter by location"
            style={{ width: 180 }}
            allowClear
            onChange={handleLocationFilter}
          >
            <Option value="Main Hall">Main Hall</Option>
            <Option value="Outdoor">Outdoor</Option>
            <Option value="VIP Room">VIP Room</Option>
            <Option value="Terrace">Terrace</Option>
            <Option value="Bar Area">Bar Area</Option>
          </Select>
        </Space>
      </Card>

      {/* Table List */}
      <Card>
        <TableList
          tables={tables}
          loading={loading}
          onEdit={handleEdit}
          onDelete={deleteTable}
          onToggleStatus={toggleStatus}
          onGenerateQR={handleGenerateQR}
        />
      </Card>

      {/* Modals */}
      <TableForm
        open={formOpen}
        onCancel={handleFormClose}
        onSubmit={handleFormSubmit}
        initialValues={selectedTable}
        loading={loading}
      />

      <QRCodeModal
        open={qrModalOpen}
        onCancel={handleQrModalClose}
        table={selectedTable}
        onRegenerate={handleQrRegenerate}
      />
    </div>
  );
};

export default Tables;
