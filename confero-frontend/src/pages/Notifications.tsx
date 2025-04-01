// src/components/Notifications.tsx
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../Store/authStore";
import { useNotificationStore } from "../Store/notificationStore";
import { handleFriendRequestAction } from "../api/auth";
import { clearNotifications, Notification } from "../api/notification";

const Notifications: React.FC = () => {
  const { accessToken } = useAuthStore();
  const { notifications, isLoadingNotifications, errorNotifications, fetchNotifications } = useNotificationStore();
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [actionStatus, setActionStatus] = useState<{ [key: string]: string }>({});
  const [clearLoading, setClearLoading] = useState<boolean>(false);
  const [clearError, setClearError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchNotifications(accessToken);
    }
  }, [accessToken, fetchNotifications]);

  const handleFriendRequest = async (action: 'accept' | 'reject', notificationId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [notificationId]: true }));
      const notification = notifications.find(n => n.id === notificationId);
      const friendRequestId = notification?.friend_requestId;

      if (!friendRequestId) {
        throw new Error("Friend request ID not found in notification");
      }

      const response = await handleFriendRequestAction(friendRequestId, action);
      setActionStatus(prev => ({ ...prev, [notificationId]: response.message }));
      fetchNotifications(accessToken!); // Refresh notifications

      setTimeout(() => {
        setActionStatus(prev => ({ ...prev, [notificationId]: "" }));
      }, 3000);
    } catch (error) {
      const err = error as Error;
      setActionStatus(prev => ({ ...prev, [notificationId]: err.message }));
      setTimeout(() => {
        setActionStatus(prev => ({ ...prev, [notificationId]: "" }));
      }, 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  const handleClearNotifications = async () => {
    if (!accessToken) return;
    setClearLoading(true);
    setClearError(null);
    try {
      await clearNotifications(accessToken);
      // Clear notifications in the store after successful API call
      useNotificationStore.setState({ notifications: [] });
    } catch (error) {
      const err = error as Error;
      setClearError(err.message);
      setTimeout(() => setClearError(null), 3000); // Clear error after 3 seconds
    } finally {
      setClearLoading(false);
    }
  };

  if (isLoadingNotifications) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900/80">
        <p className="text-white text-lg animate-pulse">Loading notifications...</p>
      </div>
    );
  }

  if (errorNotifications) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900/80">
        <p className="text-red-400 text-lg">Error: {errorNotifications}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900/80 pt-20 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Notifications
          </h2>
          {notifications.length > 0 && (
            <button
              onClick={handleClearNotifications}
              disabled={clearLoading}
              className={`px-4 py-2 rounded-md text-white transition-colors ${
                clearLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {clearLoading ? "Clearing..." : "Clear All"}
            </button>
          )}
        </div>
        {clearError && (
          <p className="text-red-400 text-center mb-4">{clearError}</p>
        )}
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`bg-gray-800/90 backdrop-blur-md rounded-xl p-5 shadow-lg border ${
                  notification.is_read ? "border-gray-700" : "border-indigo-500"
                }`}
              >
                <p className="text-gray-300">{notification.message}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
                
                {notification.notification_type === "friend_request" && notification.friend_requestId && (
                  <div className="flex space-x-3 mt-3">
                    <button
                      onClick={() => handleFriendRequest('accept', notification.id)}
                      disabled={actionLoading[notification.id]}
                      className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors ${
                        actionLoading[notification.id] ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {actionLoading[notification.id] ? "Processing..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleFriendRequest('reject', notification.id)}
                      disabled={actionLoading[notification.id]}
                      className={`px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white transition-colors ${
                        actionLoading[notification.id] ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {actionLoading[notification.id] ? "Processing..." : "Reject"}
                    </button>
                  </div>
                )}
                {actionStatus[notification.id] && (
                  <p className={`text-sm mt-2 ${
                    actionStatus[notification.id].includes("error") || actionStatus[notification.id].includes("Failed")
                      ? "text-red-400"
                      : "text-green-400"
                  }`}>
                    {actionStatus[notification.id]}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center text-lg">No notifications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;