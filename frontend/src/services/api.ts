import axios from "axios";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ??
    "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach bearer token to outgoing requests if authenticated
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("revora_token") ||
    sessionStorage.getItem("revora_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});