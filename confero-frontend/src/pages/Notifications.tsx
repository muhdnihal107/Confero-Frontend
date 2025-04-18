import React, { useEffect, useState } from "react";
import { useAuthStore } from "../Store/authStore";
import { useNotificationStore } from "../Store/notificationStore";
import { clearNotifications, Notification, markAsRead, fetchReadedNotifications } from "../api/notification";
import { handleFriendRequestAction } from "../api/auth";
import { acceptRoomInvite } from "../api/room";

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
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [actionStatus, setActionStatus] = useState<{ [key: string]: string }>({});
  const [readNotifications, setReadNotifications] = useState<Notification[]>([]);
  const [showReadNotifications, setShowReadNotifications] = useState<boolean>(false);
  const [readLoading, setReadLoading] = useState<boolean>(false);
  const [readError, setReadError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      setupWebSocketConnection(accessToken);
      fetchNotifications(accessToken);
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
      if (response) {
        await markAsRead(notificationId);
      }
      setActionStatus((prev) => ({ ...prev, [notificationId]: response.message }));
      fetchNotifications(accessToken!);

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

  const handleRoomInvite = async (notificationId: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [notificationId]: true }));
      const notification = notifications.find((n) => n.id === notificationId);
      const friendRequestId = notification?.friend_requestId;
      if (!friendRequestId) {
        throw new Error("Friend request ID not found in notification");
      }

      const response = await acceptRoomInvite(friendRequestId);
      setActionStatus((prev) => ({ ...prev, [notificationId]: response.message }));
      fetchNotifications(accessToken!);

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
      setReadNotifications([]);
      setShowReadNotifications(false);
    } catch (error) {
      const err = error as Error;
      setClearError(err.message);
      setTimeout(() => setClearError(null), 3000);
    } finally {
      setClearLoading(false);
    }
  };


  const handleShowReadNotifications = async () => {
    if (!accessToken || showReadNotifications) {
      setShowReadNotifications(false);
      setReadNotifications([]);
      return;
    }
    setReadLoading(true);
    setReadError(null);
    try {
      const readNotifications = await fetchReadedNotifications(accessToken);
      setReadNotifications(readNotifications);
      setShowReadNotifications(true);
    } catch (error) {
      const err = error as Error;
      setReadError(err.message);
      setTimeout(() => setReadError(null), 3000);
    } finally {
      setReadLoading(false);
    }
  };

  if (isLoadingNotifications) {
    return (
      <p className="text-white text-lg animate-pulse text-center">Loading notifications...</p>
    );
  }

  if (errorNotifications) {
    return <p className="text-red-400 text-lg text-center">Error: {errorNotifications}</p>;
  }

  return (
    <div className="p-8 bg-gray-900/80 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-white mb-6">Notifications</h2>
        {notifications.length > 0 && (
          <button
            onClick={handleClearNotifications}
            disabled={clearLoading}
            className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
              clearLoading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-[#ac2828b8] hover:bg-[#b3402c] hover:shadow-lg"
            }`}
          >
            {clearLoading ? "Clearing..." : "Clear All Notifications"}
          </button>
        )}
        {clearError && (
          <p className="text-red-400 text-center mt-2 animate-fade-in">{clearError}</p>
        )}
        <div className="mt-6 space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`p-6 bg-gray-800 text-white rounded-xl border transition-all duration-200 hover:shadow-md ${
                  notification.is_read ? "border-gray-700 opacity-80" : "border-indigo-500"
                }`}
              >
                <p className="text-lg">{notification.message}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
                {notification.notification_type === "room_invite" &&
                  notification.friend_requestId && (
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => handleRoomInvite(notification.id)}
                        disabled={actionLoading[notification.id]}
                        className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-all duration-200 ${
                          actionLoading[notification.id]
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:shadow-md"
                        }`}
                      >
                        {actionLoading[notification.id] ? "Processing..." : "Accept"}
                      </button>
                    </div>
                  )}
                {notification.notification_type === "friend_request" &&
                  notification.friend_requestId && (
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => handleFriendRequest("accept", notification.id)}
                        disabled={actionLoading[notification.id]}
                        className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-all duration-200 ${
                          actionLoading[notification.id]
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:shadow-md"
                        }`}
                      >
                        {actionLoading[notification.id] ? "Processing..." : "Accept"}
                      </button>
                      <button
                        onClick={() => handleFriendRequest("reject", notification.id)}
                        disabled={actionLoading[notification.id]}
                        className={`px-5 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-all duration-200 ${
                          actionLoading[notification.id]
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:shadow-md"
                        }`}
                      >
                        {actionLoading[notification.id] ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  )}
                {actionStatus[notification.id] && (
                  <p
                    className={`text-sm mt-3 animate-fade-in ${
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
            <p className="text-center text-gray-400 text-lg">No unread notifications.</p>
          )}
        </div>

        {/* Show More Notifications Button */}
        {notifications.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={handleShowReadNotifications}
              disabled={readLoading}
              className={`px-6 py-2 rounded-lg text-white font-light transition-all duration-200 ${
                readLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-[#3f3f3f58] hover:bg-[#ffffff2a] hover:shadow-lg"
              }`}
            >
              {readLoading
                ? "Loading..."
                : showReadNotifications
                ? "Hide Read Notifications"
                : "Show Read Notifications"}
            </button>
          </div>
        )}
        {readError && (
          <p className="text-red-400 text-center mt-2 animate-fade-in">{readError}</p>
        )}

        {/* Read Notifications Section */}
        {showReadNotifications && readNotifications.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-2xl font-semibold text-white text-center">
              Read Notifications
            </h3>
            {readNotifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className="p-6 bg-gray-800 text-white rounded-xl border border-gray-700 opacity-80 transition-all duration-200 hover:shadow-md hover:opacity-100"
              >
                <p className="text-lg">{notification.message}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;