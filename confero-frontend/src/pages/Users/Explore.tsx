import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sendFriendRequest, fetchFriends, fetchStrangers,fetchFriendCount } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../Store/authStore";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const Explore: React.FC = () => {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingRequest, setSendingRequest] = useState<number | null>(null);
  const [requestStatus, setRequestStatus] = useState<{ [key: number]: string }>({});

  // Fetch friends
  const { data: friends, isLoading: isFriendsLoading, error: friendsError } = useQuery({
    queryKey: ["friends"],
    queryFn: fetchFriends,
    enabled: !!accessToken,
  });

  // Fetch strangers
  const { data: strangers, isLoading: isStrangersLoading, error: strangersError } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: fetchStrangers,
    enabled: !!accessToken,
  });

  const { data: friendCount, isLoading: isFriendCountLoading } = useQuery({
    queryKey: ["friendCount"],
    queryFn: fetchFriendCount,
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
      setRequestStatus((prev) => ({ ...prev, [userId]: "Friend request sent!" }));
      setTimeout(() => {
        setRequestStatus((prev) => ({ ...prev, [userId]: "" }));
      }, 3000);
    } catch (err) {
      const error = err as Error;
      setRequestStatus((prev) => ({ ...prev, [userId]: error.message }));
      setTimeout(() => {
        setRequestStatus((prev) => ({ ...prev, [userId]: "" }));
      }, 3000);
    } finally {
      setSendingRequest(null);
    }
  };

  const handleMessageClick = () => {
    navigate(`/chat/`);
  };

  const filteredStrangers = strangers?.filter((profile) =>
    profile.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isFriendsLoading || isStrangersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <p className="text-white text-2xl font-semibold animate-pulse">Loading...</p>
      </div>
    );
  }

  if (friendsError || strangersError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <p className="text-red-500 text-2xl font-semibold">
          Error: {(friendsError as Error)?.message || (strangersError as Error)?.message}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030103a8] text-white flex flex-col">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-6 py-20">
        {/* Search Section */}
        <section className="mb-12">
          <div className="relative max-w-3xl mx-auto">
            <input
              type="text"
              placeholder="Search strangers by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-4 px-6 pl-12 rounded-full bg-gray-900 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-white placeholder-gray-500 shadow-lg transition-all duration-300 hover:shadow-xl"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500"
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
        </section>

        {/* Title Section */}
        <section className="mb-14 text-center">
          <h2 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
            Explore Connections
          </h2>
          <p className="text-gray-400 mt-2 text-lg">Connect with friends or discover new ones</p>
        </section>

        {/* Friends and Strangers Split Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Friends List */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-6">Your Friends</h3>
            {friends && friends.length > 0 ? (
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
              <p className="text-gray-300 text-lg">No friends yet. Add some below!</p>
            )}
          </div>

          {/* Strangers List */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-6">Discover Strangers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStrangers && filteredStrangers.length > 0 ? (
                filteredStrangers.map((profile, index) => (
                  <article
                    key={index}
                    className="bg-gray-900 rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 border border-gray-800 hover:border-indigo-600"
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      {profile.profile_photo ? (
                        <img
                          src={`http://localhost:8000${profile.profile_photo}`}
                          alt={profile.username || "Profile"}
                          className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-600/20 hover:ring-indigo-600/50 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center ring-4 ring-gray-700/50 hover:ring-indigo-600/50 transition-all duration-300">
                          <span className="text-gray-300 text-3xl font-bold">
                            {profile.username?.charAt(0)?.toUpperCase() || "A"}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-white truncate">
                          {profile.username || "Anonymous"}
                        </h3>
                        <p className="text-gray-300 text-sm truncate">{profile.email}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {profile.phone_number || "No phone"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSendFriendRequest(profile.user_id)}
                        disabled={sendingRequest === profile.user_id}
                        className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-5 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg ${
                          sendingRequest === profile.user_id ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      >
                        {sendingRequest === profile.user_id ? "Sending..." : "Add Friend"}
                      </button>
                      {requestStatus[profile.user_id] && (
                        <p
                          className={`text-sm font-medium ${
                            requestStatus[profile.user_id].includes("error") ||
                            requestStatus[profile.user_id].includes("Failed")
                              ? "text-red-500"
                              : "text-green-500"
                          }`}
                        >
                          {requestStatus[profile.user_id]}
                        </p>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full text-center">
                  <p className="text-gray-300 text-lg">
                    {searchTerm ? "No matching strangers found." : "No strangers available."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Explore;