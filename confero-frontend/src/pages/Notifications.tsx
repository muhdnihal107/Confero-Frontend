// src/components/Notifications.tsx
import React, { useEffect } from "react";
import { useAuthStore } from "../Store/authStore";
import { useNotificationStore } from "../Store/notificationStore";

const Notifications: React.FC = () => {
  const { accessToken } = useAuthStore();
  const { notifications, isLoadingNotifications, errorNotifications, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (accessToken) {
      fetchNotifications(accessToken);
    }
  }, [accessToken, fetchNotifications]);

  const handleFriendRequest = (action: 'accept' | 'reject', notificationId: string) => {
    // TODO: Implement friend request handling logic
    console.log(`Friend request ${action}ed for notification ${notificationId}`);
    // You would typically call an API here to handle the friend request
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
        <h2 className="text-4xl font-bold text-center mb-10 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Notifications
        </h2>
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
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
                
                {/* Add buttons for friend request notifications */}
                {notification.notification_type === "friend_request" && (
                  <div className="flex space-x-3 mt-3">
                    <button
                      onClick={() => handleFriendRequest('accept', notification.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleFriendRequest('reject', notification.id)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white transition-colors"
                    >
                      Reject
                    </button>
                  </div>
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