import axios from "axios";

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  "https://school-system-backend-6znb.onrender.com/api/v1";

const api = axios.create({
  baseURL: rawBaseUrl.replace(/\/+$/, ""),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aas_token");
  console.log("Token from localStorage:", token ? "exists" : "missing");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Authorization header set:", `Bearer ${token.substring(0, 20)}...`);
  }
  
  // Add debugging for HTTP method
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.log(`API Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    if (error.response?.status === 401) {
      console.log("401 Unauthorized - Token expired or invalid");
      window.dispatchEvent(new Event("tokenExpired"));
    }

    if (error.response?.status === 403) {
      console.log("403 Forbidden - Possible issues:");
      console.log("1. Token expired");
      console.log("2. Invalid token format");
      console.log("3. User lacks required permissions");
      console.log("4. Backend authentication issue");
      console.log("Error response:", error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default api;
