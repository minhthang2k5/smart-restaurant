import api from "./api";

const tableService = {
  // ========== CRUD Operations ==========

  /**
   * Get tables's list with filter/sort
   * @param {Object} params - { status, location, sort, order }
   */
  getAllTables: async (params = {}) => {
    return api.get("/admin/tables", { params });
  },

  getTableById: async (id) => {
    return api.get(`/admin/tables/${id}`);
  },

  /**
   * Create new table
   * @param {Object} data - { tableNumber, capacity, location, description }
   */
  createTable: async (data) => {
    return api.post("/admin/tables", data);
  },

  /**
   * Update table
   */
  updateTable: async (id, data) => {
    return api.put(`/admin/tables/${id}`, data);
  },

  /**
   * Change status (active/inactive)
   */
  updateTableStatus: async (id, status) => {
    return api.patch(`/admin/tables/${id}/status`, { status });
  },

  /**
   * Delete table (soft delete)
   */
  deleteTable: async (id) => {
    return api.delete(`/admin/tables/${id}`);
  },

  // ========== QR Code Operations ==========

  /**
   * Generate QR code for table
   */
  generateQRCode: async (id) => {
    return api.post(`/admin/tables/${id}/qr/generate`);
  },

  /**
   * Download single QR code
   * @param {string} format - 'png' | 'pdf'
   * @param {boolean} includeWifi - true | false
   */
  downloadQRCode: async (id, format = "png", includeWifi = false) => {
    return api.get(`/admin/tables/${id}/qr/download`, {
      params: { format, includeWifi },
      responseType: "blob",
    });
  },

  /**
   * Download all QR codes
   * @param {string} format - 'zip' | 'pdf'
   */
  downloadAllQRCodes: async (format = "zip") => {
    return api.get("/admin/tables/qr/download-all", {
      params: { format },
      responseType: "blob",
    });
  },
};

export default tableService;
