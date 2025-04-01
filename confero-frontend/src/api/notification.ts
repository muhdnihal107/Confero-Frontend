// src/api/notificationApi.ts
import { AxiosError } from "axios";
import axios from "axios";
import { useAuthStore } from "../Store/authStore";

export interface Notification {
  id: string;
  user_id: number;
  friend_requestId?: number | null;
  notification_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const API_BASE_URL = "http://localhost:8003/api";
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log("No accessToken found in store");
  }
  return config;
}); // Adjust if your backend URL differs


export const fetchNotifications = async (accessToken: string): Promise<Notification[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/notifications/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Login failed");  }
};

export const clearNotifications = async (accessToken: string): Promise<void> => {
  try {
    await api.delete("/clear/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to clear notifications");
  }
};