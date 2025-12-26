import { Pagination as AntPagination } from "antd";

export default function Pagination({
  current,
  total,
  pageSize,
  onChange,
  showSizeChanger = true,
  pageSizeOptions = ["10", "20", "50", "100"],
}) {
  return (
    <div
      style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}
    >
      <AntPagination
        current={current}
        total={total}
        pageSize={pageSize}
        onChange={onChange}
        showSizeChanger={showSizeChanger}
        pageSizeOptions={pageSizeOptions}
        showTotal={(total, range) =>
          `${range[0]}-${range[1]} trong ${total} mục`
        }
      />
    </div>
  );
}
