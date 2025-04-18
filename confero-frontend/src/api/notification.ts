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
const WS_BASE_URL = "ws://localhost:8003/ws/notifications/";

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
});

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
    throw new Error(axiosError.response?.data?.detail || "Failed to fetch notifications");
  }
};


export const fetchReadedNotifications = async (accessToken: string): Promise<Notification[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/notifications/readed/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to fetch notifications");
  }
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


export const markAsRead = async (notification_id: string): Promise<void> => {
  try {
    console.log('mar',notification_id)
    await axios.patch(`${API_BASE_URL}/read/${notification_id}/`);
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to mark as read notification");
  }
};


export const setupWebSocket = (
  accessToken: string,
  onMessage: (notification: Notification) => void
): WebSocket => {
  const ws = new WebSocket(`${WS_BASE_URL}?token=${accessToken}`);
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;

  ws.onopen = () => {
    console.log("WebSocket connected");
    reconnectAttempts = 0; // Reset on successful connection
  };

  ws.onmessage = (event) => {
    const notification: Notification = JSON.parse(event.data);
    onMessage(notification);
  };

  ws.onclose = (event) => {
    console.log("WebSocket disconnected", event.code, event.reason);
    if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) { // 1000 = normal closure
      console.log(`Reconnecting in ${reconnectDelay / 1000}s... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
      setTimeout(() => {
        reconnectAttempts++;
        setupWebSocket(accessToken, onMessage); // Recursive call with limits
      }, reconnectDelay);
    } else if (reconnectAttempts >= maxReconnectAttempts) {
      console.error("Max reconnection attempts reached.");
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return ws;
};