import publicApi from "./publicApi";
import customerApi from "./customerApi";

const customerAuthService = {
  login: (email, password) =>
    publicApi.post("/auth/login", { email, password }),
  register: (email, password, firstName, lastName) =>
    publicApi.post("/auth/register", { email, password, firstName, lastName }),

  getProfile: () => customerApi.get("/users/profile"),
  updateProfile: (payload) => customerApi.put("/users/profile", payload),
};

export default customerAuthService;
