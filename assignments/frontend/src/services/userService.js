import api from "./api";

const userService = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (payload) => api.put("/users/profile", payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/users/profile/avatar", formData, {
      headers: {
        "Content-Type": undefined, // Let axios set the correct multipart boundary
      },
    });
  },
};

export default userService;
