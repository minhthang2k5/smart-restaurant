import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000, //30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "blob") {
      return response.data; // Return blob directly
    }

    return response.data;
  },
  (error) => {
    // Handle blob errors (e.g., 404 when downloading)
    if (error.response?.config?.responseType === "blob") {
      // Convert blob error to JSON
      return error.response.data.text().then((text) => {
        try {
          const json = JSON.parse(text);
          console.error("Download error:", json.message);
        } catch {
          console.error("Download error:", text);
        }
        return Promise.reject(error);
      });
    }

    const message = error.response?.data?.message || "Something went wrong";
    console.error("API Error:", message);
    return Promise.reject(error);
  }
);

export default api;
