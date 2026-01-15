import api from "./api";

const userService = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (payload) => api.put("/users/profile", payload),
};

export default userService;
