// src/components/Profile.tsx
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../Store/authStore";
import { useMutation } from "@tanstack/react-query";
import { updateProfile, fetchFriends, Profile,fetchFriendCount } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { useQuery } from "@tanstack/react-query";

// Rename the component to ProfilePage to avoid conflict with Profile interface
const ProfilePage: React.FC = () => {
  const {
    user,
    fetchProfileData,
    isLoadingProfile,
    errorProfile,
    logout,
  } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);

  const { data: friendCount, isLoading: isFriendCountLoading } = useQuery({
    queryKey: ["friendCount"],
    queryFn: fetchFriendCount,
  });


  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    if (user?.phone_number) setPhoneNumber(user.phone_number);
  }, [user]);

  useEffect(() => {
    const loadFriends = async () => {
      if (!user) return;
      setFriendsLoading(true);
      setFriendsError(null);
      try {
        const friendData = await fetchFriends();
        setFriends(friendData);
      } catch (error) {
        setFriendsError((error as Error).message);
      } finally {
        setFriendsLoading(false);
      }
    };
    loadFriends();
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: (data: { phone_number?: string; profile_photo?: File }) => updateProfile(data),
    onSuccess: (data: Profile) => {
      console.log("Profile updated successfully:", data);
      useAuthStore.setState({
        user: {
          email: user?.email || "",
          username: data.username || user?.username || null,
          age: data.age || null,
          phone_number: data.phone_number || null,
          profile_photo: data.profile_photo || user?.profile_photo || null,
        },
      });
      setIsEditing(false);
      setProfilePhoto(null);
      setPreviewPhoto(null);
    },
    onError: (error: Error) => {
      console.error("Profile update failed:", error.message);
      useAuthStore.setState({ errorProfile: error.message });
    },
  });

  // const handleImageClick = () => {
  //   setIsEditing(true);
  // };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMessageClick = () => {
    navigate(`/chat/`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    profileMutation.mutate({
      phone_number: phoneNumber,
      profile_photo: profilePhoto || undefined,
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (isLoadingProfile) {
    return <p className="text-center text-white text-lg animate-pulse">Loading profile...</p>;
  }
  if (errorProfile) {
    navigate('/login');
  }
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#030103a8] pt-20 pb-12 px-6">
        <div className="bg-gray-900 backdrop-blur-md shadow-xl rounded-xl p-8 w-full max-w-3xl mx-auto border border-gray-700">
          {/* Profile Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-indigo-500">
                {user.profile_photo ? (
                  <img
                    src={`http://localhost:8000${user.profile_photo}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 text-lg font-medium">
                      {user.username?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-white">
                  {user.username || user.email.split("@")[0]}
                </h2>
                <div className="flex space-x-6 mt-2 text-gray-400">
                {isFriendCountLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                <span className="text-indigo-400 font-semibold">
                  {friendCount?.friend_count || 0} {friendCount?.friend_count === 1 ? "Friend" : "Friends"}
                </span>
              )}
                </div>
                <p className="mt-2 text-gray-300">{user.email}</p>
                {user.phone_number && (
                  <p className="text-gray-400">Phone: {user.phone_number}</p>
                )}
                {user.age && <p className="text-gray-400">Age: {user.age}</p>}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium"
              >
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
                <h3 className="text-2xl font-semibold text-white mb-6">Edit Profile</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-300 mb-2">Profile Photo:</label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-indigo-500">
                        {previewPhoto ? (
                          <img
                            src={previewPhoto}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : user.profile_photo ? (
                          <img
                            src={`http://localhost:8000${user.profile_photo}`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No Photo</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                        disabled={profileMutation.isPending}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Phone Number:</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                      disabled={profileMutation.isPending}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium disabled:opacity-50"
                      disabled={profileMutation.isPending}
                    >
                      {profileMutation.isPending ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setProfilePhoto(null);
                        setPreviewPhoto(null);
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                  {profileMutation.isError && (
                    <p className="text-red-400 text-sm">Error: {profileMutation.error.message}</p>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Friends Section */}
          <div className="mt-10">
            <h3 className="text-xl font-semibold text-white mb-4">Friends</h3>
            {friendsLoading ? (
              <p className="text-gray-400 text-center">Loading friends...</p>
            ) : friendsError ? (
              <p className="text-red-400 text-center">Error: {friendsError}</p>
            ) : friends.length > 0 ? (
              <div className="space-y-4">
                 {friends.map((friend, index) => (
                  <article
                    key={index}
                    className="bg-gray-900 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-800 hover:border-indigo-600"
                  >
                    <div className="flex items-center space-x-4">
                      {friend.profile_photo ? (
                        <img
                          src={`http://localhost:8000${friend.profile_photo}`}
                          alt={friend.username || "Profile"}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-600/20"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center ring-2 ring-gray-700/50">
                          <span className="text-gray-300 text-xl font-bold">
                            {friend.username?.charAt(0)?.toUpperCase() || "A"}
                          </span>
                        </div>
                      )}
                      <div className="flex-grow">
                        <h4 className="text-lg font-semibold text-white truncate">
                          {friend.username || "Anonymous"}
                        </h4>
                        <p className="text-gray-400 text-sm truncate">{friend.email}</p>
                      </div>
                      <button
                        onClick={handleMessageClick}
                        className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-1.5 px-4 rounded-full hover:from-green-700 hover:to-teal-700 transition-all duration-300 font-semibold shadow-md"
                      >
                        Message
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center">No friends yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage; // Export renamed component