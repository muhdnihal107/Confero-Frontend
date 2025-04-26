// src/pages/RoomDetail.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRoomDetails, updateRoom, Room, roomInvite } from '../../api/room';
import { fetchFriends } from '../../api/auth';
import { useAuthStore } from '../../Store/authStore';
interface ProfileResponse {
  user_id: number;
  username: string;
  email: string;
  phone_number: string | null;
  bio: string | null;
  profile_photo: string | null;
}


const RoomDetail: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoom, setEditedRoom] = useState({ name: '', description: '', visibility: 'public' as const });
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [friends, setFriends] = useState<ProfileResponse[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {user} = useAuthStore();
  const userId = parseInt(user?.user_id || '0');

  useEffect(() => {
    const loadRoom = async () => {
      if (!room_id) return;
      try {
        const roomData = await fetchRoomDetails(room_id);
        setRoom(roomData);
        setEditedRoom({
          name: roomData.name,
          description: roomData.description || '',
          visibility: roomData.visibility,
        });
      } catch (error) {
        console.error('Failed to load room:', error);
      }
    };
    loadRoom();
  }, [room_id]);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friendsData = await fetchFriends();
        setFriends(friendsData);
      } catch (error) {
        console.error('Failed to load friends:', error);
        setInviteError('Failed to fetch friends');
      }
    };
    loadFriends();
  }, []);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };
    startVideo();

    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleMute = () => {
    if (videoStream) {
      const audioTrack = videoStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const handleInviteFriend = async (friend: ProfileResponse) => {
    if (!room_id) return;
    try {
      await roomInvite(friend.email, friend.user_id, room_id);
      const updatedRoom = await fetchRoomDetails(room_id);
      setRoom(updatedRoom);
      setInviteError(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to invite friend';
      setInviteError(errorMessage);
      console.error('Error inviting friend:', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!room_id) return;
      const updatedRoom = await updateRoom(parseInt(room_id), editedRoom);
      setRoom(updatedRoom);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  const startVideoCall = () => {
    if (!room_id) return;
    navigate(`/video-call/${room_id}`);
  };

  if (!room) return <div className="text-center text-2xl text-gray-300 p-12 animate-pulse font-semibold">Loading Room...</div>;

  const isCreator = userId === room.creator_id;

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-900 text-white overflow-hidden">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,_102,_241,_0.2),_transparent_70%)] pointer-events-none"></div>

      <div className="flex min-h-screen pt-20 px-8 sm:px-16 gap-10">
        {/* Left Section: Room Info and Video */}
        <div className="w-3/4 space-y-10">
          {/* Room Info Card */}
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-indigo-500/20 transition-all duration-300 hover:shadow-indigo-500/20">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 tracking-tight">
              {room.name}
            </h1>
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editedRoom.name}
                    onChange={(e) => setEditedRoom({ ...editedRoom, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter room name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={editedRoom.description}
                    onChange={(e) => setEditedRoom({ ...editedRoom, description: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none h-28 resize-none transition-all duration-200 placeholder-gray-400"
                    placeholder="Add a description..."
                  />
                </div>
                <div>
                  <label htmlFor="visibility" className="block text-sm font-medium text-gray-200 mb-2">
                    Visibility
                  </label>
                  <select
                    id="visibility"
                    value={editedRoom.visibility}
                    onChange={(e) => setEditedRoom({ ...editedRoom, visibility: e.target.value as 'public' | 'private' })}
                    className="w-full p-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-md"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-xl bg-gray-600 text-white font-semibold hover:bg-gray-700 transform hover:scale-105 transition-all duration-300 shadow-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-200 text-lg leading-relaxed tracking-wide">
                  {room.description || 'No description available'}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-gray-300 font-medium">
                    <strong className="text-purple-300">Visibility:</strong> {room.visibility}
                  </span>
                  <span className="text-gray-300 font-medium">
                    <strong className="text-purple-300">Creator:</strong> {room.creator_email}
                  </span>
                </div>
                {isCreator && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-md"
                  >
                    Edit Room
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Video Preview Card */}
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-indigo-500/20 transition-all duration-300 hover:shadow-indigo-500/20">
            <h2 className="text-2xl font-semibold text-indigo-300 mb-6">Video Preview</h2>
            <div className="flex justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted={isMuted}
                className="w-full max-w-2xl rounded-2xl shadow-lg border border-gray-700/50 transition-all duration-300 hover:scale-105"
              />
            </div>
            <div className="flex justify-center gap-6 mt-6">
              <button
                onClick={toggleMute}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={startVideoCall}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 text-white font-semibold hover:from-green-600 hover:via-teal-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Start Video Call
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Friends and Participants */}
        <div className="w-1/4 fixed top-20 right-8 h-[calc(100vh-5rem)]">
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-indigo-500/20 h-full overflow-y-auto transition-all duration-300 hover:shadow-indigo-500/20">
            {/* Invite Friends Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Invite Friends
              </h2>
              {inviteError && (
                <p className="mt-2 text-red-400 bg-red-900/20 p-3 rounded-xl text-center font-medium animate-pulse">
                  {inviteError}
                </p>
              )}
              {friends.length > 0 ? (
                <ul className="mt-4 space-y-4">
                  {friends.map((friend) => (
                    <li
                      key={friend.user_id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200"
                    >
                      {friend.profile_photo ? (
                        <img
                          src={`http://localhost:8000${friend.profile_photo}`}
                          alt={friend.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/50 transition-transform duration-300 hover:scale-110"
                          onError={(e) => (e.currentTarget.src = '/fallback-image.jpg')}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xl font-bold text-indigo-300 border-2 border-indigo-500/50 transition-transform duration-300 hover:scale-110">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="block text-gray-100 font-medium">{friend.username}</span>
                        <span className="text-sm text-gray-400">{friend.email}</span>
                      </div>
                      <button
                        onClick={() => handleInviteFriend(friend)}
                        className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-md"
                      >
                        Invite
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-gray-400 italic">No friends to invite yet</p>
              )}
            </div>

            {/* Participants Section */}
            <div>
              <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Participants</h2>
              {room.participants.length > 0 ? (
                <ul className="mt-4 space-y-3 text-gray-200">
                  {room.participants.map((participant) => (
                    <li
                      key={participant}
                      className="p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200"
                    >
                      {participant}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-gray-400 italic">No participants yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;