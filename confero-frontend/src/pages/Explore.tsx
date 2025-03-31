import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllProfiles,sendFriendRequest } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../Store/authStore";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Explore: React.FC = () => {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingRequest, setSendingRequest] = useState<number | null>(null); // Track which profile is being processed
  const [requestStatus, setRequestStatus] = useState<{ [key: number]: string }>({}); // Store request status per profile


  const { data: profiles, isLoading, error } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: fetchAllProfiles,
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
    }
  }, [accessToken, navigate]);

  const handleSendFriendRequest = async (userId: number) => {
    try {
      setSendingRequest(userId);
      const response = await sendFriendRequest(userId);
      setRequestStatus(prev => ({ ...prev, [userId]: "Friend request sent!" }));
      // Reset status after 3 seconds
      setTimeout(() => {
        setRequestStatus(prev => ({ ...prev, [userId]: "" }));
      }, 3000);
    } catch (err) {
      const error = err as Error;
      setRequestStatus(prev => ({ ...prev, [userId]: error.message }));
      setTimeout(() => {
        setRequestStatus(prev => ({ ...prev, [userId]: "" }));
      }, 3000);
    } finally {
      setSendingRequest(null);
    }
  };


  const filteredProfiles = profiles?.filter(profile =>
    profile.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white text-lg animate-pulse">Loading profiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-red-400 text-lg">Error: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0201017a] text-white">
      <Header />
      <div className="max-w-6xl mx-auto pt-24 pb-12 px-4">
        <div className="relative mb-8 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search profiles by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 px-4 pr-10 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-indigo-500 text-white placeholder-gray-400 transition-all duration-300"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <h2 className="text-4xl font-bold text-center mb-10 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Discover Connections
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles && filteredProfiles.length > 0 ? (
            filteredProfiles.map((profile, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700"
              >
                <div className="flex flex-col items-center">
                  {profile.profile_photo ? (
                    <img
                      src={`http://localhost:8000${profile.profile_photo}`}
                      alt={profile.username || "Profile"}
                      className="w-24 h-24 rounded-full object-cover mb-4 ring-2 ring-indigo-500"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4 ring-2 ring-gray-600">
                      <span className="text-gray-400 text-lg font-medium">
                        {profile.username?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-white mb-1 truncate w-full text-center">
                    {profile.username || "Anonymous"}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2 truncate w-full text-center">
                    {profile.email}
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    {profile.phone_number || "No phone"}
                  </p>
                  <button
                    onClick={() => handleSendFriendRequest(profile.user_id)}
                    disabled={sendingRequest === profile.user_id}
                    className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium ${
                      sendingRequest === profile.user_id ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {sendingRequest === profile.user_id ? "Sending..." : "Add Friend"}
                  </button>
                  {requestStatus[profile.user_id] && (
                    <p className={`text-sm mt-2 ${
                      requestStatus[profile.user_id].includes("error") || requestStatus[profile.user_id].includes("Failed")
                        ? "text-red-400"
                        : "text-green-400"
                    }`}>
                      {requestStatus[profile.user_id]}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center col-span-full text-lg">
              {searchTerm ? "No matching profiles found." : "No profiles available."}
            </p>
          )}
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Explore;