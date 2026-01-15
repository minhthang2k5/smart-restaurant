import { useEffect, useMemo, useState } from "react";
import { App, message, Spin } from "antd";
import staffService from "../../services/staffService";
import StaffFilters from "../../components/staff/StaffFilters";
import StaffFormModal from "../../components/staff/StaffFormModal";
import StaffTable from "../../components/staff/StaffTable";
import { useAuth } from "../../contexts/AuthContext";

export default function Staff() {
  const { user } = useAuth();
  const { modal } = App.useApp();

  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const queryParams = useMemo(() => {
    const params = { page, limit: pageSize };
    if (filters.role && filters.role !== "all") params.role = filters.role;
    if (filters.status && filters.status !== "all")
      params.status = filters.status;
    if (filters.search) params.search = filters.search;
    return params;
  }, [filters, page, pageSize]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffService.getStaff(queryParams);
      setData(response.data || []);
      setTotal(response.pagination?.totalCount || 0);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Tải danh sách nhân viên thất bại";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (record) => {
    setEditing(record);
    setOpen(true);
  };

  const onSubmit = async (payload) => {
    try {
      setLoading(true);
      if (editing) {
        await staffService.updateStaff(editing.id, payload);
        message.success("Cập nhật nhân viên thành công");
      } else {
        await staffService.createStaff(payload);
        message.success("Tạo nhân viên thành công");
      }
      setOpen(false);
      setEditing(null);
      await fetchStaff();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        (editing ? "Cập nhật nhân viên thất bại" : "Tạo nhân viên thất bại");
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onToggleStatus = async (record, nextStatus) => {
    try {
      setLoading(true);
      await staffService.updateStaffStatus(record.id, nextStatus);
      message.success("Cập nhật trạng thái thành công");
      await fetchStaff();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Cập nhật trạng thái thất bại";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (record) => {
    if (record.id === user?.id) {
      modal.warning({
        title: "Không thể xóa chính bạn",
        content:
          "Vì lý do bảo mật, bạn không thể xóa tài khoản của chính mình.",
      });
      return;
    }

    try {
      setLoading(true);
      await staffService.deleteStaff(record.id);
      message.success("Xóa nhân viên thành công");
      await fetchStaff();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Xóa nhân viên thất bại";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    if (pagination?.current !== page) setPage(pagination.current || 1);
    if (pagination?.pageSize !== pageSize) {
      setPageSize(pagination.pageSize || 10);
      setPage(1);
    }
  };

  const pagination = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    showTotal: (t) => `Total ${t} staff`,
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>Staff Management</h2>
      </div>

      <StaffFilters
        value={filters}
        onCreate={onCreate}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      <Spin spinning={loading}>
        <StaffTable
          data={data}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          currentUserId={user?.id}
        />
      </Spin>

      <StaffFormModal
        open={open}
        editing={editing}
        loading={loading}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
      />
    </div>
  );
}
