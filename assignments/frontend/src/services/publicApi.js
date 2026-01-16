import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

publicApi.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "blob") {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || "Something went wrong";
    console.error("API Error:", message);

    if (error.response?.data?.errors) {
      console.error("Validation errors:", error.response.data.errors);
    }

    return Promise.reject(error);
  }
);

export default publicApi;
