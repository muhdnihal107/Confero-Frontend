import React, { useEffect, useState } from "react";
import { useAuthStore } from "../Store/store";
import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "../api/auth";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

// Mock friends data (replace with API call later)
const mockFriends = [
  { id: 1, name: "Participant name" },
  { id: 2, name: "Participant name" },
  { id: 3, name: "Participant name" },
];

const Profile: React.FC = () => {
  const {
    user,
    fetchProfileData,
    updateProfileData,
    isLoadingProfile,
    errorProfile,
    logout,
  } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

console.log('ggggg',user);
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    if (user?.phone_number) setPhoneNumber(user.phone_number);
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: (data: { phone_number?: string,profile_photo?: File }) => updateProfile(data),
    onSuccess: (data) => {
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

  const handleImageClick = () => {
    setIsEditing(true);
  };

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

  if (isLoadingProfile) return <p className="text-center text-white">Loading profile...</p>;
  if (errorProfile) return <p className="text-center text-red-500">Error: {errorProfile}</p>;
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <>
    <Header/>
    <div
      className="flex items-center justify-center min-h-screen px-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
    >
      <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-3xl">
        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Profile Picture */}
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
              {user.profile_photo ? (
                <img
                  src={`http://localhost:8000${user.profile_photo}`}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <input className="text-gray-500 text-sm" type="file" />
              )}
              
            </div>
            <div>
              {/* Username */}
              <h2 className="text-2xl font-semibold text-gray-800">
                {user.username || user?.email?.split("@")[0]}
              </h2>
              {/* Stats */}
              <div className="flex space-x-4 mt-2 text-gray-600">
                <p>0 Posts</p>
                <p>0 Followers</p>
                <p>0 Following</p>
              </div>
              {/* Full Name */}
              <p className="mt-2 text-gray-700">{user.email}</p>
              {/* Phone Number (if available) */}
              {user.phone_number && (
                <p className="text-gray-600">Phone: {user.phone_number}</p>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            {/* Edit Profile Button */}
            <button
              onClick={() => setIsEditing(true)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Edit Profile
            </button>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Edit Profile Form (Modal-like Overlay) */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Profile</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Photo Upload */}
                <div>
                  <label className="block text-gray-700">Profile Photo:</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      {previewPhoto ? (
                        <img
                          src={previewPhoto}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : user.profile_photo ? (
                        <img
                          src={user.profile_photo}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No Photo</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={profileMutation.isPending}
                    />
                  </div>
                </div>
                {/* Phone Number */}
                <div>
                  <label className="block text-gray-700">Phone Number:</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={profileMutation.isPending}
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-[#f06340] text-white px-4 py-2 rounded-md hover:bg-[#a12121] transition-colors"
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
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {profileMutation.isError && (
                  <p className="text-red-500">Error: {profileMutation.error.message}</p>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Friends Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800">Friends</h3>
          <div className="mt-4 space-y-4">
            {mockFriends.map((friend) => (
              <div key={friend.id} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No Image</span>
                </div>
                <p className="text-gray-700">{friend.name}</p>
                <button className="ml-auto text-gray-500 hover:text-gray-700">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 12h12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Profile;