import React, { useEffect, useState } from "react";
import { useAuthStore } from "../Store/authStore";
import { useNotificationStore } from "../Store/notificationStore";
import { clearNotifications, Notification } from "../api/notification";
import { handleFriendRequestAction } from "../api/auth"; // Import from auth API

const Notifications: React.FC = () => {
  const { accessToken } = useAuthStore();
  const {
    notifications,
    isLoadingNotifications,
    errorNotifications,
    fetchNotifications,
    setupWebSocketConnection,
    ws,
  } = useNotificationStore();
  const [clearLoading, setClearLoading] = useState<boolean>(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({}); // Loading state for actions
  const [actionStatus, setActionStatus] = useState<{ [key: string]: string }>({}); // Status messages for actions

  useEffect(() => {
    if (accessToken) {
      fetchNotifications(accessToken);
      setupWebSocketConnection(accessToken);
    }

    return () => {
      if (ws) {
        ws.close(1000, "Component unmounted");
        console.log("WebSocket closed on component unmount");
      }
    };
  }, [accessToken, fetchNotifications, setupWebSocketConnection]);

  const handleFriendRequest = async (action: "accept" | "reject", notificationId: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [notificationId]: true }));
      const notification = notifications.find((n) => n.id === notificationId);
      const friendRequestId = notification?.friend_requestId;

      if (!friendRequestId) {
        throw new Error("Friend request ID not found in notification");
      }

      const response = await handleFriendRequestAction(friendRequestId, action);
      setActionStatus((prev) => ({ ...prev, [notificationId]: response.message }));
      fetchNotifications(accessToken!); // Refresh notifications after action

      setTimeout(() => {
        setActionStatus((prev) => ({ ...prev, [notificationId]: "" }));
      }, 3000);
    } catch (error) {
      const err = error as Error;
      setActionStatus((prev) => ({ ...prev, [notificationId]: err.message }));
      setTimeout(() => {
        setActionStatus((prev) => ({ ...prev, [notificationId]: "" }));
      }, 3000);
    } finally {
      setActionLoading((prev) => ({ ...prev, [notificationId]: false }));
    }
  };

  const handleClearNotifications = async () => {
    if (!accessToken) return;
    setClearLoading(true);
    setClearError(null);
    try {
      await clearNotifications(accessToken);
      useNotificationStore.setState({ notifications: [] });
    } catch (error) {
      const err = error as Error;
      setClearError(err.message);
      setTimeout(() => setClearError(null), 3000);
    } finally {
      setClearLoading(false);
    }
  };

  if (isLoadingNotifications) {
    return <p className="text-white text-lg animate-pulse">Loading notifications...</p>;
  }

  if (errorNotifications) {
    return <p className="text-red-400 text-lg">Error: {errorNotifications}</p>;
  }

  return (
    <div className="p-6 bg-gray-900/80 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-white mb-4">Notifications</h2>
        {notifications.length > 0 && (
          <button
            onClick={handleClearNotifications}
            disabled={clearLoading}
            className={`px-4 py-2 rounded-md text-white transition-colors ${
              clearLoading ? "bg-gray-600 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {clearLoading ? "Clearing..." : "Clear All"}
          </button>
        )}
        {clearError && <p className="text-red-400 text-center">{clearError}</p>}
        <div className="mt-4 space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`p-5 bg-gray-800 text-white rounded-lg border ${
                  notification.is_read ? "border-gray-700" : "border-indigo-500"
                }`}
              >
                <p>{notification.message}</p>
                <p className="text-sm text-gray-400">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
                {notification.notification_type === "friend_request" && notification.friend_requestId && (
                  <div className="flex space-x-3 mt-3">
                    <button
                      onClick={() => handleFriendRequest("accept", notification.id)}
                      disabled={actionLoading[notification.id]}
                      className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors ${
                        actionLoading[notification.id] ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {actionLoading[notification.id] ? "Processing..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleFriendRequest("reject", notification.id)}
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
                  <p
                    className={`text-sm mt-2 ${
                      actionStatus[notification.id].includes("error") ||
                      actionStatus[notification.id].includes("Failed")
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {actionStatus[notification.id]}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">No notifications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;