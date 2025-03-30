// src/Store/notificationStore.ts
import { create } from "zustand";
import { fetchNotifications, Notification } from "../api/notification"; // Corrected import path

interface NotificationState {
  notifications: Notification[];
  isLoadingNotifications: boolean;
  errorNotifications: string | null;
  fetchNotifications: (accessToken: string) => Promise<void>;
  markAsRead: (notificationId: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  isLoadingNotifications: false,
  errorNotifications: null,

  fetchNotifications: async (accessToken: string) => {
    set({ isLoadingNotifications: true, errorNotifications: null });
    try {
      const data: Notification[] = await fetchNotifications(accessToken); // Pass accessToken and fix type
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
}));