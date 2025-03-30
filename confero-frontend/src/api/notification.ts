// src/api/notificationApi.ts
import { AxiosError } from "axios";
import axios from "axios";

export interface Notification {
  id: string;
  user_id: number;
  friend_requestId?: number | null;
  notification_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const API_BASE_URL = "http://localhost:8003/api"; // Adjust if your backend URL differs


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