import axios from "axios";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const axiosInstance = axios.create({
  baseURL: base,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
