import { create } from "zustand";
import { fetchNotifications, Notification, setupWebSocket } from "../api/notification";

interface NotificationState {
  notifications: Notification[];
  isLoadingNotifications: boolean;
  errorNotifications: string | null;
  fetchNotifications: (accessToken: string) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  addNotification: (notification: Notification) => void; // Real-time update
  setupWebSocketConnection: (accessToken: string) => void;
  ws: WebSocket | null; // Store WebSocket instance
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoadingNotifications: false,
  errorNotifications: null,
  ws: null,

  fetchNotifications: async (accessToken: string) => {
    set({ isLoadingNotifications: true, errorNotifications: null });
    try {
      const data: Notification[] = await fetchNotifications(accessToken);
      set({ notifications: data, isLoadingNotifications: false });
    } catch (error) {
      set({
        errorNotifications: (error as Error).message,
        isLoadingNotifications: false,
      });
    }
  },

  markAsRead: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ),
    }));
  },

  addNotification: (notification: Notification) => {
    set((state) => {
      const alreadyExists = state.notifications.some(
        (n) => n.id === notification.id
      );
      if (alreadyExists) {
        return {}; // Don't update the state if duplicate
      }
      return {
        notifications: [notification, ...state.notifications],
      };
    });
  },

  setupWebSocketConnection: (accessToken: string) => {
    const ws = setupWebSocket(accessToken, (notification) => {
      get().addNotification(notification); 
    });
    set({ ws }); 
  },
}));
