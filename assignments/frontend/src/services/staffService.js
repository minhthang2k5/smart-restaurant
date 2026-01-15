import api from "./api";

const staffService = {
  createStaff: (payload) => api.post("/users/staff", payload),
  getStaff: (params) => api.get("/users/staff", { params }),
  getStaffById: (id) => api.get(`/users/staff/${id}`),
  updateStaff: (id, payload) => api.put(`/users/staff/${id}`, payload),
  updateStaffStatus: (id, status) =>
    api.patch(`/users/staff/${id}/status`, { status }),
  deleteStaff: (id) => api.delete(`/users/staff/${id}`),
};

export default staffService;
