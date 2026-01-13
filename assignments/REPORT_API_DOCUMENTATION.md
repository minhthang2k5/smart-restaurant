# Report API Documentation

## Tổng quan

API báo cáo cung cấp 3 endpoints chính để xem báo cáo doanh thu, món ăn bán chạy, và dữ liệu cho biểu đồ (Chart.js/Recharts).

## Endpoints

### 1. Revenue Report - Báo cáo doanh thu theo thời gian

```
GET /api/reports/revenue
```

**Query Parameters:**
- `period` (optional): Khoảng thời gian định sẵn
  - `today`: Hôm nay
  - `yesterday`: Hôm qua
  - `7days`: 7 ngày qua
  - `30days`: 30 ngày qua
  - `this_month`: Tháng này
  - `last_month`: Tháng trước
- `startDate` (optional): Ngày bắt đầu (ISO 8601) - nếu không dùng `period`
- `endDate` (optional): Ngày kết thúc (ISO 8601) - nếu không dùng `period`
- `granularity` (optional): Mức độ chi tiết
  - `daily`: Theo ngày (mặc định)
  - `weekly`: Theo tuần
  - `monthly`: Theo tháng

**Response Example:**
```json
{
  "success": true,
  "data": {
    "granularity": "daily",
    "period": {
      "startDate": "2026-01-06T00:00:00.000Z",
      "endDate": "2026-01-13T23:59:59.999Z"
    },
    "dataPoints": [
      {
        "period": "2026-01-06",
        "orderCount": 12,
        "totalRevenue": 650.00,
        "avgOrderValue": 54.17
      },
      {
        "period": "2026-01-07",
        "orderCount": 15,
        "totalRevenue": 820.50,
        "avgOrderValue": 54.70
      }
    ],
    "summary": {
      "totalOrders": 85,
      "totalRevenue": 4500.00,
      "avgOrderValue": 52.94
    }
  }
}
```

**Use Cases:**
- Hiển thị doanh thu hàng ngày/tuần/tháng
- Theo dõi xu hướng doanh thu
- So sánh doanh thu giữa các khoảng thời gian

---

### 2. Top Selling Items - Món ăn bán chạy nhất

```
GET /api/reports/top-items
```

**Query Parameters:**
- `period` (optional): Khoảng thời gian (giống revenue report)
- `startDate` (optional): Ngày bắt đầu (ISO 8601)
- `endDate` (optional): Ngày kết thúc (ISO 8601)
- `limit` (optional): Số lượng món trả về (1-100, mặc định 10)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-01-06T00:00:00.000Z",
      "endDate": "2026-01-13T23:59:59.999Z"
    },
    "items": [
      {
        "rank": 1,
        "menuItemId": "uuid-123",
        "name": "Grilled Salmon",
        "description": "Fresh grilled salmon with herbs",
        "categoryName": "Main Dishes",
        "categoryId": "uuid-cat-1",
        "quantitySold": 45,
        "totalRevenue": 810.00,
        "orderCount": 38,
        "avgPrice": 18.00,
        "imageUrl": "/uploads/salmon.jpg"
      },
      {
        "rank": 2,
        "menuItemId": "uuid-456",
        "name": "Pasta Carbonara",
        "description": "Classic Italian pasta",
        "categoryName": "Main Dishes",
        "categoryId": "uuid-cat-1",
        "quantitySold": 38,
        "totalRevenue": 570.00,
        "orderCount": 35,
        "avgPrice": 15.00,
        "imageUrl": "/uploads/pasta.jpg"
      }
    ],
    "totalItems": 10
  }
}
```

**Use Cases:**
- Hiển thị top món bán chạy
- Phân tích món ăn phổ biến
- Quyết định menu và kho

---

### 3. Chart Data - Dữ liệu cho biểu đồ

```
GET /api/reports/chart-data
```

**Query Parameters:**
- `period` (optional): Khoảng thời gian (giống revenue report)
- `startDate` (optional): Ngày bắt đầu (ISO 8601)
- `endDate` (optional): Ngày kết thúc (ISO 8601)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-01-06T00:00:00.000Z",
      "endDate": "2026-01-13T23:59:59.999Z"
    },
    "charts": {
      "ordersPerDay": [
        {
          "date": "2026-01-06",
          "orderCount": 12,
          "revenue": 650.00
        },
        {
          "date": "2026-01-07",
          "orderCount": 15,
          "revenue": 820.50
        }
      ],
      "peakHours": [
        {
          "hour": 11,
          "label": "11 AM",
          "orderCount": 8,
          "revenue": 450.00,
          "percentage": 40,
          "isPeak": false
        },
        {
          "hour": 12,
          "label": "12 PM",
          "orderCount": 25,
          "revenue": 1350.00,
          "percentage": 100,
          "isPeak": true
        },
        {
          "hour": 19,
          "label": "7 PM",
          "orderCount": 22,
          "revenue": 1200.00,
          "percentage": 88,
          "isPeak": true
        }
      ],
      "popularItems": [
        {
          "name": "Grilled Salmon",
          "quantity": 45,
          "revenue": 810.00
        },
        {
          "name": "Pasta Carbonara",
          "quantity": 38,
          "revenue": 570.00
        }
      ]
    }
  }
}
```

**Chart Types:**
1. **ordersPerDay** - Line Chart (Biểu đồ đường)
   - Hiển thị số đơn hàng và doanh thu theo ngày
   
2. **peakHours** - Bar Chart (Biểu đồ cột)
   - Hiển thị giờ cao điểm trong ngày
   - `isPeak: true` cho các giờ có >= 80% số đơn so với giờ cao nhất
   
3. **popularItems** - Pie/Donut Chart (Biểu đồ tròn)
   - Hiển thị top 10 món ăn phổ biến

---

## Sử dụng với Frontend

### React + Chart.js Example

```jsx
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Fetch chart data
const response = await fetch('/api/reports/chart-data?period=7days');
const { data } = await response.json();

// Line Chart - Orders per day
const lineChartData = {
  labels: data.charts.ordersPerDay.map(d => d.date),
  datasets: [{
    label: 'Orders',
    data: data.charts.ordersPerDay.map(d => d.orderCount),
    borderColor: 'rgb(75, 192, 192)',
    tension: 0.1
  }]
};

// Bar Chart - Peak hours
const barChartData = {
  labels: data.charts.peakHours.map(h => h.label),
  datasets: [{
    label: 'Orders',
    data: data.charts.peakHours.map(h => h.orderCount),
    backgroundColor: data.charts.peakHours.map(h => 
      h.isPeak ? 'rgba(255, 99, 132, 0.8)' : 'rgba(54, 162, 235, 0.8)'
    )
  }]
};

// Doughnut Chart - Popular items
const doughnutChartData = {
  labels: data.charts.popularItems.map(i => i.name),
  datasets: [{
    data: data.charts.popularItems.map(i => i.revenue),
    backgroundColor: [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
    ]
  }]
};
```

### React + Recharts Example

```jsx
import { LineChart, Line, BarChart, Bar, PieChart, Pie } from 'recharts';

// Fetch data
const response = await fetch('/api/reports/chart-data?period=7days');
const { data } = await response.json();

// Line Chart Component
<LineChart data={data.charts.ordersPerDay}>
  <Line type="monotone" dataKey="orderCount" stroke="#8884d8" />
  <Line type="monotone" dataKey="revenue" stroke="#82ca9d" />
</LineChart>

// Bar Chart Component
<BarChart data={data.charts.peakHours}>
  <Bar dataKey="orderCount" fill="#8884d8" />
</BarChart>

// Pie Chart Component
<PieChart>
  <Pie 
    data={data.charts.popularItems} 
    dataKey="revenue" 
    nameKey="name" 
    fill="#8884d8" 
  />
</PieChart>
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (development only)"
}
```

### Common Errors

**400 Bad Request**
- Invalid date format
- Start date after end date
- Invalid granularity
- Invalid limit value

**500 Internal Server Error**
- Database connection error
- Query execution error

---

## Testing với REST Client

Sử dụng file `report-test.rest` để test các endpoints:

```http
### Get revenue for last 7 days
GET http://localhost:5000/api/reports/revenue?period=7days&granularity=daily

### Get top 10 items
GET http://localhost:5000/api/reports/top-items?period=7days&limit=10

### Get chart data
GET http://localhost:5000/api/reports/chart-data?period=7days
```

---

## Database Requirements

API này yêu cầu:
- Bảng `orders` có status = 'completed'
- Bảng `order_items` với quan hệ đến `orders`
- Bảng `menu_items` với thông tin món ăn
- Bảng `menu_categories` với phân loại món
- Bảng `menu_item_photos` với hình ảnh món ăn

---

## Performance Notes

- Queries được tối ưu với GROUP BY và aggregation functions
- Khuyến nghị thêm indexes:
  - `orders(status, created_at)`
  - `order_items(order_id, menu_item_id)`
- Có thể thêm Redis caching cho historical data
- Default limit cho top items là 10, max là 100

---

## Roadmap

**Future Enhancements:**
- [ ] Thêm export PDF/CSV
- [ ] Cache với Redis
- [ ] So sánh với kỳ trước (trend %)
- [ ] Thêm filter theo category
- [ ] Real-time updates với WebSocket
