import api from "./api";

const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (email, password, firstName, lastName) =>
    api.post("/auth/register", { email, password, firstName, lastName }),
  logout: () => api.post("/auth/logout"),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post("/auth/reset-password", { token, password }),
  getCurrentUser: () => api.get("/users/profile"),
};
