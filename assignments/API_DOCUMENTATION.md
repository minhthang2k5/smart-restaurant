# Smart Restaurant - QR Code API Documentation

## Table of Contents

-   [Overview](#overview)
-   [Base URL](#base-url)
-   [Authentication](#authentication)
-   [API Endpoints](#api-endpoints)
    -   [Admin Endpoints](#admin-endpoints)
    -   [Customer Endpoints](#customer-endpoints)
-   [Integration Flows](#integration-flows)
-   [Error Handling](#error-handling)
-   [Testing](#testing)

---

## Overview

This API provides QR code generation, verification, and download functionality for the Smart Restaurant table management system. The system allows:

-   Admins to generate and manage QR codes for tables
-   Customers to scan QR codes and access the menu
-   Batch operations for downloading multiple QR codes

---

## Base URL

```
Local Development: http://localhost:3000
Production: https://your-domain.com
```

---

## Authentication

**Admin Endpoints:** Will require authentication (to be implemented)  
**Customer Endpoints:** Public access via QR token validation

---

## API Endpoints

### Admin Endpoints

#### 1. Generate QR Code for Table

**Endpoint:** `POST /api/admin/tables/:id/qr/generate`

**Description:** Generates a new QR code for a specific table. If a QR code already exists, it regenerates it and invalidates the old one.

**URL Parameters:**

-   `id` (UUID, required) - The table ID

**Success Response (200 OK):**

```json
{
    "status": "success",
    "message": "QR code generated successfully",
    "data": {
        "tableId": "41d0b94f-d57f-4a47-906d-bb1e9428aeee",
        "tableNumber": "T-01",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "qrCodeImage": "data:image/png;base64,iVBORw0KGgo...",
        "createdAt": "2024-12-19T10:30:00.000Z"
    }
}
```

**Error Responses:**

-   `400 Bad Request` - Invalid UUID format
    ```json
    {
        "status": "fail",
        "message": "Invalid table ID format. Please provide a valid UUID."
    }
    ```
-   `404 Not Found` - Table not found
    ```json
    {
        "status": "fail",
        "message": "No table found with that ID"
    }
    ```
-   `500 Internal Server Error` - Server error

**Response Data Usage:**

-   `token`: Save this for future verification (not used in admin UI)
-   `qrCodeImage`: Base64 data URL - can be displayed directly in `<img>` tag
-   `createdAt`: Timestamp for tracking when QR was generated

---

#### 2. Download Single Table QR Code

**Endpoint:** `GET /api/admin/tables/:id/qr/download`

**Description:** Downloads a single table's QR code as PNG or PDF.

**URL Parameters:**

-   `id` (UUID, required) - The table ID

**Query Parameters:**

-   `format` (string, optional) - Download format: `png` or `pdf` (default: `png`)
-   `includeWifi` (boolean, optional) - Include WiFi info in PDF: `true` or `false` (default: `false`)

**Response:** Binary file (PNG/PDF)

**Headers:**

-   `Content-Type`: `image/png` or `application/pdf`
-   `Content-Disposition`: `attachment; filename="table-T-01-qr.png"`

**Examples:**

PNG Download:

```
GET /api/admin/tables/41d0b94f-d57f-4a47-906d-bb1e9428aeee/qr/download?format=png
```

PDF Download with WiFi:

```
GET /api/admin/tables/41d0b94f-d57f-4a47-906d-bb1e9428aeee/qr/download?format=pdf&includeWifi=true
```

**Response:** Binary file that triggers browser download automatically

**How to Use:**

-   Can be opened directly in browser (triggers download)
-   PNG format: High-resolution image for digital displays
-   PDF format: Print-ready document with table info, instructions, and optional WiFi details

---

#### 3. Download All QR Codes

**Endpoint:** `GET /api/admin/tables/qr/download-all`

**Description:** Downloads QR codes for all active tables as a ZIP file or bulk PDF.

**Query Parameters:**

-   `format` (string, optional) - Download format: `zip` or `pdf` (default: `zip`)

**Response:** Binary file (ZIP/PDF)

**Headers:**

-   `Content-Type`: `application/zip` or `application/pdf`
-   `Content-Disposition`: `attachment; filename="all-table-qr-codes.zip"`

**Examples:**

Download all as ZIP:

```
GET /api/admin/tables/qr/download-all?format=zip
```

Download all as single PDF:

```
GET /api/admin/tables/qr/download-all?format=pdf
```

**Response:** Binary file (ZIP contains multiple PNG files, PDF contains multiple pages)

**How to Use:**

-   ZIP format: Contains one PNG file per active table
-   PDF format: One page per table, ready for bulk printing
-   Browser will automatically download the file
-   ZIP filename: `all-table-qr-codes.zip`
-   PDF filename: `all-tables-qr.pdf`

---

### Customer Endpoints

#### 4. Verify QR Token and Get Menu

**Endpoint:** `GET /api/menu/verify`

**Description:** Verifies a scanned QR code token and returns table information. This is the entry point for customers after scanning a QR code.

**Query Parameters:**

-   `token` (string, required) - The JWT token from the QR code
-   `table` (UUID, optional) - The table ID (for UX purposes, not used for authentication)

**Success Response (200 OK):**

```json
{
    "status": "success",
    "data": {
        "table": {
            "id": "41d0b94f-d57f-4a47-906d-bb1e9428aeee",
            "table_number": "T-01",
            "location": "Indoor"
        }
    }
}
```

**Error Responses:**

-   `400 Bad Request` - Missing token

    ```json
    {
        "status": "fail",
        "message": "Token is required"
    }
    ```

-   `401 Unauthorized` - Invalid/expired token
    ```json
    {
        "status": "fail",
        "message": "This QR code is invalid or has expired. Please ask staff for assistance."
    }
    ```

**Response Data Usage:**

-   `id`: Unique table identifier
-   `table_number`: Display-friendly table name (e.g., "T-01")
-   `location`: Table location (e.g., "Indoor", "Patio")
-   Store table info in session storage for use throughout the ordering flow
-   Keep token for subsequent API calls (menu, orders)

---

## Integration Flows

## Integration Flows

### Admin Flow: QR Code Management

**Step 1: Table List Page**

-   Display list of all tables
-   Each table shows: table number, location, status
-   Action buttons: "Generate QR", "Download PDF", "Download PNG"

**Step 2: Generate QR Code**

1. Click "Generate QR" button for specific table
2. Send POST request to `/api/admin/tables/:id/qr/generate`
3. Receive response with:
    - `qrCodeImage`: Display in preview modal/popup
    - `token`: Store temporarily (not displayed to user)
    - `createdAt`: Show generation timestamp
4. Display QR code preview with download options

**Step 3: Download QR Code**

-   **Single Download:**
    -   Click "Download PDF" or "Download PNG"
    -   Open URL: `/api/admin/tables/:id/qr/download?format=pdf`
    -   Browser automatically downloads file
-   **Bulk Download:**
    -   Click "Download All" button with format selection
    -   Open URL: `/api/admin/tables/qr/download-all?format=zip`
    -   Receive ZIP with all table QR codes or single PDF

**Step 4: Print/Display**

-   PDF files are print-ready with proper layout
-   PNG files are high-resolution for digital displays
-   Place printed QR codes on physical tables

---

### Customer Flow: QR Code Scanning

**Step 1: QR Code Scan**

-   Customer scans QR code with phone camera
-   QR code contains URL: `https://your-app.com/menu?table={tableId}&token={token}`
-   Phone automatically opens the URL in browser

**Step 2: Frontend Route Handling**

-   App loads at `/menu` route
-   Extract URL parameters:
    -   `token` (required)
    -   `table` (optional, for UX)

**Step 3: Token Verification**

1. Show loading state: "Verifying QR code..."
2. Send GET request to `/api/menu/verify?token={token}&table={tableId}`
3. Handle responses:

    **Success (200):**

    - Receive table info: `id`, `table_number`, `location`
    - Store in session storage for current visit
    - Display: "Welcome to Table T-01"
    - Show menu items

    **Error (401):**

    - QR code invalid/expired
    - Display error: "This QR code is no longer valid. Please ask staff for assistance."
    - Provide "Try Again" or "Contact Staff" button

    **Error (400):**

    - Missing token
    - Display: "Invalid QR code. Please scan again."

**Step 4: Menu Interaction**

-   Customer browses menu
-   Table context maintained in session
-   All subsequent orders tied to verified table
-   Token used for authenticated customer actions

---

### Flow Diagrams

**Admin QR Generation Flow:**

```
Admin Dashboard
    ↓
Select Table → Click "Generate QR"
    ↓
POST /api/admin/tables/:id/qr/generate
    ↓
Receive QR Image (base64)
    ↓
Display Preview → Download Options
    ↓
GET /api/admin/tables/:id/qr/download?format=pdf
    ↓
Print/Place on Table
```

**Customer QR Verification Flow:**

```
Customer Scans QR Code
    ↓
Phone Opens: /menu?table=xxx&token=yyy
    ↓
Frontend Extracts Parameters
    ↓
GET /api/menu/verify?token=yyy&table=xxx
    ↓
Success → Store Table Info → Show Menu
    ↓
Error → Show Error Message
```

---

### Session Management

**What to Store:**

-   **Session Storage:**
    -   `currentTable`: Table info object `{ id, table_number, location }`
    -   `sessionToken`: JWT token for current visit
-   **When to Store:** Immediately after successful verification
-   **When to Clear:** When user navigates away or session ends
-   **Why:** Maintain context throughout ordering flow without re-verification

---

### Error State Handling

**Loading States:**

-   "Generating QR code..."
-   "Downloading..."
-   "Verifying QR code..."

**Success States:**

-   "QR code generated successfully!"
-   "Download complete"
-   "Welcome to Table {number}"

**Error States:**

| Error Type              | Display Message                                                     | Action Options               |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------- |
| Invalid Token           | "QR code is invalid or expired. Please ask staff for assistance."   | "Contact Staff", "Try Again" |
| Missing Token           | "Invalid QR code. Please scan again."                               | Back to home                 |
| Network Error           | "Cannot connect to server. Check your internet connection."         | "Retry"                      |
| Table Not Found         | "Table not found. Please contact staff."                            | "Contact Staff"              |
| Server Error            | "Something went wrong. Please try again later."                     | "Retry"                      |
| Invalid Table ID (UUID) | "Invalid table reference. Please scan a valid QR code."             | Back to home                 |
| No Active Tables        | "No tables available for download." (admin bulk download)           | Close modal                  |
| Download Failed         | "Failed to download QR code. Please try again." (admin single/bulk) | "Retry", "Cancel"            |

---

## Error Handling

### Common Error Codes

| Status Code | Error Type            | Description                                        | Typical Cause                           |
| ----------- | --------------------- | -------------------------------------------------- | --------------------------------------- |
| 400         | Bad Request           | Invalid input (malformed UUID, missing parameters) | Invalid table ID format, missing token  |
| 401         | Unauthorized          | Invalid or expired token                           | Token regenerated, expired, or tampered |
| 404         | Not Found             | Table not found                                    | Table deleted or never existed          |
| 500         | Internal Server Error | Server-side error                                  | Database error, server misconfiguration |

### Error Response Format

All error responses follow this structure:

```json
{
    "status": "fail",
    "message": "Human-readable error message"
}
```

Development mode may include additional `error` field with technical details.

### Error Handling Strategy

**For Admin Endpoints:**

-   400/404 errors → Show user-friendly message with retry option
-   500 errors → "Something went wrong" message, log error, contact support

**For Customer Endpoints:**

-   401 errors → Clear instructions to ask staff for help (QR invalid)
-   Network errors → "Check your connection" with retry button
-   Any error → Provide clear next steps

**Recommended Error Messages:**

**Recommended Error Messages:**

| HTTP Status | User-Facing Message                                                | Action                 |
| ----------- | ------------------------------------------------------------------ | ---------------------- |
| 400         | "Invalid request. Please check your selection and try again."      | Close, Retry           |
| 401         | "This QR code is no longer valid. Please ask staff for help."      | Contact Staff          |
| 404         | "Table not found. Please verify the table number."                 | Go Back, Contact Staff |
| 500         | "We're experiencing technical difficulties. Please try again."     | Retry, Contact Support |
| Network     | "Cannot connect to server. Please check your internet connection." | Retry                  |

---

## Testing

### Quick Testing Guide

**Test Environment Setup:**

1. Start backend server: `node server.js`
2. Ensure database has at least one active table
3. Note a valid table UUID for testing

**Postman Testing Sequence:**

1. **Generate QR Code:**

    - Method: POST
    - URL: `http://localhost:3000/api/admin/tables/{TABLE_UUID}/qr/generate`
    - Save `token` from response

2. **Verify Token:**

    - Method: GET
    - URL: `http://localhost:3000/api/menu/verify?token={SAVED_TOKEN}&table={TABLE_UUID}`
    - Should return table info

3. **Download Single QR:**

    - Method: GET
    - URL: `http://localhost:3000/api/admin/tables/{TABLE_UUID}/qr/download?format=pdf`
    - Use "Send and Download" in Postman

4. **Download All QR Codes:**
    - Method: GET
    - URL: `http://localhost:3000/api/admin/tables/qr/download-all?format=zip`
    - Use "Send and Download" in Postman

### Browser Testing

Open these URLs directly in browser to test downloads:

**Single QR (PNG):**

```
http://localhost:3000/api/admin/tables/YOUR_TABLE_UUID/qr/download?format=png
```

**Single QR (PDF with WiFi):**

```
http://localhost:3000/api/admin/tables/YOUR_TABLE_UUID/qr/download?format=pdf&includeWifi=true
```

**All QR Codes (ZIP):**

```
http://localhost:3000/api/admin/tables/qr/download-all?format=zip
```

**All QR Codes (Bulk PDF):**

```
http://localhost:3000/api/admin/tables/qr/download-all?format=pdf
```

### QR Code Verification Testing

1. Generate QR code via Postman
2. Copy the `qrCodeImage` value (data URL)
3. Paste in browser address bar to view QR code
4. Scan with phone OR extract token manually
5. Test verification: `http://localhost:3000/api/menu/verify?token=YOUR_TOKEN`

---

## Important Notes

### Token Security

-   Tokens contain: `tableId`, `restaurantId`, `timestamp`, `iat`, `exp`
-   Tokens are signed with JWT_SECRET (never expose this)
-   Regenerating a QR code instantly invalidates the old token
-   Default expiration: 90 days (configurable via `JWT_EXPIRES_IN`)

### QR Code Content

QR codes encode this URL format:

```
https://your-frontend.com/menu?table={tableId}&token={signedToken}
```

-   `table` parameter is optional (for UX only)
-   Backend only trusts the `tableId` inside the verified token
-   Never use the URL `table` parameter for business logic

### Download Behavior

-   **PNG:** High-resolution (1000x1000px) for digital displays
-   **PDF (Single):** One page with table info, QR code, instructions, optional WiFi
-   **PDF (Bulk):** One page per active table
-   **ZIP:** Contains one PNG file per active table

### Database Requirements

-   Only tables with `status = 'active'` are included in bulk downloads
-   Tables need `qr_token` and `qr_token_created_at` columns
-   Token regeneration updates both columns atomically

---

## Support & Troubleshooting

**Common Issues:**

-   **"Table not found"** → Verify table exists in database and UUID is correct
-   **"Invalid token"** → Token may have been regenerated, generate new QR code
-   **Downloads not working in Postman** → Use "Send and Download" option
-   **QR code doesn't scan** → Verify frontend URL is correct in environment variables

**Environment Variables Required:**

```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=90d
RESTAURANT_ID=restaurant_001
RESTAURANT_NAME=Your Restaurant Name
FRONTEND_URL=http://localhost:3001
WIFI_SSID=optional
WIFI_PASSWORD=optional
```

**Logs to Check:**

-   Server console for error details
-   Database connection status
-   Environment variable loading

---

**Last Updated:** December 19, 2024  
**API Version:** 1.0.0
