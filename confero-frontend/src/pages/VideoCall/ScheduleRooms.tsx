
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../Store/RoomStore';
import { useAuthStore } from '../../Store/authStore';
import { scheduleVideoCall, Room, VideoCallSchedule } from '../../api/room';
import { fetchFriends,ProfileResponse } from '../../api/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../../components/Header';

const ScheduleRooms: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken, user } = useAuthStore();
  const { userRooms, fetchUserRooms } = useRoomStore();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<ProfileResponse[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<ProfileResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch user rooms and friends on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (accessToken && user) {
          await fetchUserRooms();
          const friends = await fetchFriends();
          console.log('Fetched friends:', friends);
          // Exclude current user
          setAvailableUsers(friends.filter((u) => u.user_id !== user.user_id));
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [accessToken, user, fetchUserRooms]);

  // Handle participant addition via search
  const handleAddParticipant = () => {
    const foundUser = availableUsers.find((u) => u.email.toLowerCase() === searchEmail.toLowerCase());
    console.log('Found user:', foundUser);
    if (foundUser && !participants.some((p) => p.user_id === foundUser.user_id)) {
      setParticipants([...participants, foundUser]);
      setSearchEmail('');
      toast.info(`Added ${foundUser.username || foundUser.email}`);
    } else {
      toast.error(foundUser ? 'User already added' : 'User not found');
    }
  };

  // Handle participant addition via button
  const handleAddParticipantById = (user: ProfileResponse) => {
    if (!participants.some((p) => p.user_id === user.user_id)) {
      setParticipants([...participants, user]);
      toast.info(`Added ${user.username || user.email}`);
    } else {
      toast.error('User already added');
    }
  };

  // Handle participant removal
  const handleRemoveParticipant = (id: number) => {
    setParticipants(participants.filter((p) => p.user_id !== id));
    toast.info('Participant removed');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || participants.length === 0 || !scheduledTime) {
      toast.error('Please select a room, at least one participant, and a valid time');
      return;
    }

    setIsLoading(true);
    try {
      console.log(scheduledTime,'schedule time');
      const date = new Date(scheduledTime);
      const utcDate = date.toISOString();

      await scheduleVideoCall(selectedRoomId, participants, utcDate);
      toast.success('Video call scheduled successfully!');
      navigate('/room');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to schedule video call';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 text-white overflow-hidden">
      <Header />
      <div className="pt-24 px-6 sm:px-12">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-8 animate-slideInLeft">
          Schedule a Video Call
        </h1>

        {error && (
          <div className="text-red-500 bg-red-100/20 p-4 rounded-lg mb-6 text-center font-medium animate-fadeIn">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Room Selection */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Select a Room</h2>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-300 text-lg animate-pulse">Loading rooms...</p>
              </div>
            ) : userRooms.length === 0 ? (
              <p className="text-gray-400">No rooms available. Create a room first.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {userRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl ${
                      selectedRoomId === room.id
                        ? 'border-indigo-500 bg-indigo-900/30'
                        : 'border-gray-700 bg-gray-900/40'
                    }`}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <h3 className="text-lg font-bold text-white">{room.name}</h3>
                    <p className="text-gray-300 truncate">{room.description || 'No description'}</p>
                    <p className="text-sm text-gray-400">
                      Created: {new Date(room.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduling Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-gray-900/20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-gray-700/30 animate-fadeIn"
            >
              <div className="mb-6">
                <label className="block text-lg font-semibold text-indigo-300 mb-2">
                  Add Participants
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Enter user email"
                    className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.user_id}
                      className="flex items-center bg-indigo-900/50 text-white px-3 py-1 rounded-full text-sm"
                    >
                      <span>{participant.username || participant.email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(participant.user_id)}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                {participants.length === 0 && (
                  <p className="text-gray-400 mt-2">No participants added yet.</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-lg font-semibold text-indigo-300 mb-2">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-medium hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 transform hover:scale-105 transition-all duration-300 ease-in-out"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Scheduling...
                  </span>
                ) : (
                  'Schedule Video Call'
                )}
              </button>
            </form>
          </div>

          {/* Available Users List */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Available Friends</h2>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-300 text-lg animate-pulse">Loading friends...</p>
              </div>
            ) : availableUsers.length === 0 ? (
              <p className="text-gray-400">No friends available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {availableUsers.map((friend) => (
                  <div
                    key={friend.user_id}
                    className="flex items-center p-4 rounded-xl bg-gray-900/40 backdrop-blur-lg border border-gray-700/30 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl animate-fadeIn"
                  >
                {friend.profile_photo !== null ? (
                    <img
                      src={`http://localhost:8000${friend.profile_photo}` || '/fallback-avatar.jpg'}
                      alt={friend.username || friend.email}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                      onError={(e) => (e.currentTarget.src = '/fallback-avatar.jpg')}
                    />
                ):(
                    <img
                      alt={friend.username || friend.email}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                      onError={(e) => (e.currentTarget.src = '/fallback-avatar.jpg')}
                    />
                )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {friend.username || friend.email}
                      </h3>
                      <p className="text-sm text-gray-400">{friend.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddParticipantById(friend)}
                      disabled={participants.some((p) => p.user_id === friend.user_id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                        participants.some((p) => p.user_id === friend.user_id)
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105'
                      }`}
                    >
                      {participants.some((p) => p.user_id === friend.user_id) ? 'Added' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleRooms;
