import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({ baseURL: API, withCredentials: false });

api.interceptors.request.use((cfg) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sv_token");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (typeof window !== "undefined" && err?.response?.status === 401) {
      localStorage.removeItem("sv_token");
      if (location.pathname !== "/login") location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const apiUrl = API;
