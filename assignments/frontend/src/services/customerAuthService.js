import publicApi from "./publicApi";
import customerApi from "./customerApi";

const customerAuthService = {
  login: (email, password) =>
    publicApi.post("/auth/login", { email, password }),
  register: (email, password, firstName, lastName) =>
    publicApi.post("/auth/register", { email, password, firstName, lastName }),

  getProfile: () => customerApi.get("/users/profile"),
  updateProfile: (payload) => customerApi.put("/users/profile", payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return customerApi.post("/users/profile/avatar", formData, {
      headers: {
        "Content-Type": undefined, // Let axios set the correct multipart boundary
      },
    });
  },
};

export default customerAuthService;
