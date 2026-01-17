# Related Items API Documentation

## Overview
API endpoint để lấy danh sách các món ăn liên quan (related items) dựa trên cùng category. Được sử dụng trong trang chi tiết món ăn để gợi ý các món tương tự cho khách hàng.

---

## API Endpoint

### Get Related Menu Items

**Endpoint:** `GET /api/menu/items/:itemId/related`

**Description:** Lấy danh sách các món ăn cùng category với món hiện tại, loại trừ món đang xem.

**Access:** Public (không cần authentication)

---

## Request

### URL Parameters

| Parameter | Type   | Required | Description                     |
|-----------|--------|----------|---------------------------------|
| `itemId`  | UUID   | Yes      | ID của món ăn đang được xem     |

### Query Parameters

| Parameter | Type   | Required | Default | Description                           |
|-----------|--------|----------|---------|---------------------------------------|
| `limit`   | Number | No       | 4       | Số lượng món liên quan tối đa trả về |

### Example Request

```http
GET /api/menu/items/123e4567-e89b-12d3-a456-426614174000/related
GET /api/menu/items/123e4567-e89b-12d3-a456-426614174000/related?limit=6
```

---

## Response

### Success Response (200 OK)

**Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "price": "decimal",
      "status": "string",
      "prep_time_minutes": "integer",
      "is_chef_recommended": "boolean",
      "category_id": "uuid",
      "photos": [
        {
          "id": "uuid",
          "url": "string",
          "is_primary": "boolean"
        }
      ]
    }
  ]
}
```

**Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Grilled Chicken",
      "description": "Juicy grilled chicken with herbs",
      "price": "15.00",
      "status": "available",
      "prep_time_minutes": 20,
      "is_chef_recommended": true,
      "category_id": "cat-123",
      "photos": [
        {
          "id": "photo-1",
          "url": "https://res.cloudinary.com/...",
          "is_primary": true
        }
      ]
    },
    {
      "id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
      "name": "Roasted Turkey",
      "description": "Perfectly roasted turkey breast",
      "price": "18.00",
      "status": "available",
      "prep_time_minutes": 25,
      "is_chef_recommended": false,
      "category_id": "cat-123",
      "photos": [
        {
          "id": "photo-2",
          "url": "https://res.cloudinary.com/...",
          "is_primary": true
        }
      ]
    }
  ]
}
```

### Error Responses

#### Item Not Found (404)
```json
{
  "success": false,
  "message": "Món ăn không tồn tại"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Không thể tải các món liên quan"
}
```

---

## Business Logic

### Sorting Priority
Món ăn được sắp xếp theo thứ tự:
1. **Chef Recommendations first** - Món được đầu bếp đề xuất hiển thị đầu tiên
2. **Alphabetical order** - Sắp xếp theo tên A-Z

### Filtering Rules
- Chỉ trả về món có `status = 'available'`
- Chỉ trả về món có `is_deleted = false`
- Loại trừ món đang được xem (`id != itemId`)
- Chỉ lấy món trong cùng `category_id`

### Photos
- Mỗi món có thể có nhiều photos
- Photos được sắp xếp với `is_primary = true` lên đầu
- Nếu không có photo, mảng `photos` sẽ rỗng `[]`

---

## Frontend Integration

### 1. Service Layer (menuService.js)

```javascript
// src/services/menuService.js

/**
 * Get related menu items
 * @param {string} itemId - The menu item ID
 * @param {number} limit - Maximum number of items to return (default: 4)
 * @returns {Promise} API response with related items
 */
export const getRelatedMenuItems = async (itemId, limit = 4) => {
  return api.get(`/menu/items/${itemId}/related`, { 
    params: { limit } 
  });
};
```

### 2. Component Usage (GuestItemDetail.jsx)

```jsx
// src/pages/customer/GuestItemDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as menuService from '../../services/menuService';

export default function GuestItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch item detail
        const itemResponse = await menuService.getPublicMenuItem(itemId);
        setItem(itemResponse.data);
        
        // Fetch related items
        const relatedResponse = await menuService.getRelatedMenuItems(itemId, 4);
        setRelatedItems(relatedResponse.data || []);
        
      } catch (error) {
        message.error('Failed to load item details');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId]);

  return (
    <div>
      {/* Item detail content */}
      
      {/* Related Items Section */}
      {relatedItems.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3>You might also like:</h3>
          <RelatedItemsCarousel items={relatedItems} />
        </div>
      )}
    </div>
  );
}
```

### 3. Related Items UI Component

```jsx
// src/components/menu/RelatedItemsCarousel.jsx
import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { StarFilled } from '@ant-design/icons';

export default function RelatedItemsCarousel({ items }) {
  const navigate = useNavigate();

  const handleItemClick = (itemId) => {
    navigate(`/menu/items/${itemId}`);
    window.scrollTo(0, 0); // Scroll to top
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: 12, 
      overflowX: 'auto',
      paddingBottom: 12 
    }}>
      {items.map((item) => {
        const primaryPhoto = item.photos?.find(p => p.is_primary);
        
        return (
          <Card
            key={item.id}
            hoverable
            style={{ minWidth: 150, maxWidth: 150 }}
            cover={
              primaryPhoto?.url ? (
                <img
                  src={primaryPhoto.url}
                  alt={item.name}
                  style={{ height: 120, objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  height: 120,
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40
                }}>
                  🍽️
                </div>
              )
            }
            onClick={() => handleItemClick(item.id)}
          >
            <Card.Meta
              title={
                <div style={{
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.name}
                  {item.is_chef_recommended && (
                    <StarFilled style={{ 
                      color: '#faad14', 
                      marginLeft: 4,
                      fontSize: 12 
                    }} />
                  )}
                </div>
              }
              description={
                <div style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#1890ff'
                }}>
                  ${Number(item.price).toFixed(2)}
                </div>
              }
            />
          </Card>
        );
      })}
    </div>
  );
}
```

---

## Usage Examples

### Example 1: Basic Usage (4 items)
```javascript
const relatedItems = await menuService.getRelatedMenuItems(
  '123e4567-e89b-12d3-a456-426614174000'
);
console.log(relatedItems.data); // Array of 4 items
```

### Example 2: Custom Limit (6 items)
```javascript
const relatedItems = await menuService.getRelatedMenuItems(
  '123e4567-e89b-12d3-a456-426614174000',
  6 // Get up to 6 related items
);
```

### Example 3: Error Handling
```javascript
try {
  const response = await menuService.getRelatedMenuItems(itemId);
  
  if (response.success) {
    setRelatedItems(response.data);
  }
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Item not found');
  } else {
    console.error('Failed to load related items:', error.message);
  }
}
```

---

## Edge Cases

### Case 1: Item có ít hơn limit items trong category
- API sẽ trả về tất cả items có sẵn (ít hơn limit)
- Frontend cần check `relatedItems.length > 0` trước khi hiển thị section

```jsx
{relatedItems.length > 0 && (
  <div>
    <h3>Related Items</h3>
    <RelatedItemsCarousel items={relatedItems} />
  </div>
)}
```

### Case 2: Item là món duy nhất trong category
- API trả về mảng rỗng `data: []`
- Frontend không hiển thị related items section

### Case 3: Invalid itemId
- API trả về 404 error
- Frontend nên navigate về menu page hoặc hiển thị error

### Case 4: Scroll Behavior
Khi user click vào related item:
```javascript
const handleItemClick = (itemId) => {
  navigate(`/menu/items/${itemId}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

---

## Performance Considerations

### Optimization Tips

1. **Lazy Loading**: Fetch related items sau khi item detail đã load
```javascript
useEffect(() => {
  // Load item first
  fetchItem();
}, [itemId]);

useEffect(() => {
  // Load related items after item is loaded
  if (item) {
    fetchRelatedItems();
  }
}, [item]);
```

2. **Caching**: Cache related items để tránh fetch lại khi quay lại
```javascript
const relatedItemsCache = useRef({});

const fetchRelatedItems = async () => {
  if (relatedItemsCache.current[itemId]) {
    setRelatedItems(relatedItemsCache.current[itemId]);
    return;
  }
  
  const response = await menuService.getRelatedMenuItems(itemId);
  relatedItemsCache.current[itemId] = response.data;
  setRelatedItems(response.data);
};
```

3. **Parallel Fetching**: Fetch cả item và related items cùng lúc
```javascript
const [itemResponse, relatedResponse] = await Promise.all([
  menuService.getPublicMenuItem(itemId),
  menuService.getRelatedMenuItems(itemId)
]);
```

---

## Testing

### Test Cases

1. ✅ Get related items with default limit (4)
2. ✅ Get related items with custom limit (6)
3. ✅ Get related items for item with no related items (empty array)
4. ✅ Get related items for invalid itemId (404 error)
5. ✅ Verify chef recommendations appear first
6. ✅ Verify current item is excluded from results
7. ✅ Verify only available items are returned

### Test File
See: `assignments/backend/related-items-test.rest`

---

## FAQ

**Q: Related items có bao gồm món đang xem không?**  
A: Không, món đang xem được loại trừ khỏi kết quả.

**Q: Nếu không có món nào cùng category thì sao?**  
A: API trả về mảng rỗng `data: []`.

**Q: Related items có sorted theo gì?**  
A: Ưu tiên chef recommendations trước, sau đó sắp xếp theo tên A-Z.

**Q: Có giới hạn limit tối đa không?**  
A: Không có hard limit, nhưng recommend dùng 4-6 items cho UX tốt.

**Q: Photos có luôn available không?**  
A: Không, mảng photos có thể rỗng. Frontend cần check và hiển thị placeholder.

**Q: API có support pagination không?**  
A: Không, vì related items thường chỉ cần 4-6 món nên không cần pagination.

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-17 | 1.0.0 | Initial release - Related items API |

---

## Support

Nếu có vấn đề hoặc câu hỏi, liên hệ:
- Backend team lead
- Check backend logs: `assignments/backend/server.js`
- Test endpoint: `assignments/backend/related-items-test.rest`
