import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRoomDetails, updateRoom, roomInvite } from '../../api/room';
import { fetchFriends } from '../../api/auth';
import { useAuthStore } from '../../Store/authStore';
import { AxiosError } from 'axios';

interface ProfileResponse {
  user_id: number;
  username: string;
  email: string;
  phone_number: string | null;
  bio: string | null;
  profile_photo: string | null;
}

// Assumed Room interface based on usage
interface Room {
  id: number;
  creator_id: number;
  creator_email: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: 'public' | 'private';
  invited_users: string[];
  thumbnail: string | null;
  participants: string[];
  created_at: string;
  updated_at: string;
}

const RoomDetail: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoom, setEditedRoom] = useState<{
    name: string;
    description: string;
    visibility: 'public' | 'private';
  }>({ name: '', description: '', visibility: 'public' });
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [friends, setFriends] = useState<ProfileResponse[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuthStore();

  // Type-safe user ID
  const userId = user?.user_id ? parseInt(user.user_id, 10) : null;

  useEffect(() => {
    const loadRoom = async () => {
      if (!room_id) {
        setIsLoading(false);
        return;
      }
      try {
        const roomData = await fetchRoomDetails(room_id);
        setRoom(roomData);
        setEditedRoom({
          name: roomData.name,
          description: roomData.description || '',
          visibility: roomData.visibility,
        });
      } catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        console.error('Failed to load room:', axiosError.message);
      } finally {
        setIsLoading(false);
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
        const axiosError = error as AxiosError<{ detail?: string }>;
        setInviteError(axiosError.response?.data?.detail || 'Failed to fetch friends');
        console.error('Failed to load friends:', axiosError.message);
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
    if (!room_id) {
      setInviteError('Room ID is missing');
      return;
    }
    try {
      await roomInvite(friend.email, friend.user_id, room_id);
      const updatedRoom = await fetchRoomDetails(room_id);
      setRoom(updatedRoom);
      setInviteError(null);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      const errorMessage = axiosError.response?.data?.detail || 'Failed to invite friend';
      setInviteError(errorMessage);
      console.error('Error inviting friend:', axiosError.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room_id) return;
    try {
      const updatedRoom = await updateRoom(parseInt(room_id, 10), editedRoom);
      setRoom(updatedRoom);
      setIsEditing(false);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      console.error('Error updating room:', axiosError.message);
    }
  };

  const startVideoCall = () => {
    if (!room_id) return;
    navigate(`/video-call/${room_id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-2xl font-semibold text-red-400 bg-red-900/20 p-4 rounded-lg">
          Room not found
        </div>
      </div>
    );
  }

  const isCreator = userId !== null && userId === room.creator_id;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800/80 backdrop-blur-md border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {room.name}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
            aria-label="Go back"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section: Room Info and Video */}
          <div className="lg:w-2/3 space-y-8">
            {/* Room Info Card */}
            <section className="bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 border border-indigo-500/20 shadow-lg transition-all hover:shadow-indigo-500/30">
              <div className="flex items-center gap-4 mb-6">
                {room.thumbnail && (
                  <img
                    src={`http://localhost:8000${room.thumbnail}`}
                    alt={`${room.name} thumbnail`}
                    className="w-16 h-16 rounded-lg object-cover border border-indigo-500/50"
                    onError={(e) => (e.currentTarget.src = '/fallback-thumbnail.jpg')}
                  />
                )}
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Room Details
                </h2>
              </div>
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                      Room Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={editedRoom.name}
                      onChange={(e) => setEditedRoom({ ...editedRoom, name: e.target.value })}
                      className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400"
                      placeholder="Enter room name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={editedRoom.description}
                      onChange={(e) => setEditedRoom({ ...editedRoom, description: e.target.value })}
                      className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-24 resize-none transition-all placeholder-gray-400"
                      placeholder="Add a description..."
                    />
                  </div>
                  <div>
                    <label htmlFor="visibility" className="block text-sm font-medium text-gray-300 mb-2">
                      Visibility
                    </label>
                    <select
                      id="visibility"
                      value={editedRoom.visibility}
                      onChange={(e) =>
                        setEditedRoom({ ...editedRoom, visibility: e.target.value as 'public' | 'private' })
                      }
                      className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                      aria-label="Save changes"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-all shadow-md"
                      aria-label="Cancel editing"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-300 text-lg">{room.description || 'No description available'}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-indigo-300 font-medium">Visibility:</span>{' '}
                      <span className="text-gray-200">{room.visibility}</span>
                    </div>
                    <div>
                      <span className="text-indigo-300 font-medium">Creator:</span>{' '}
                      <span className="text-gray-200">{room.creator_email}</span>
                    </div>
                  </div>
                  {isCreator && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                      aria-label="Edit room details"
                    >
                      Edit Room
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Video Preview Card */}
            <section className="bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 border border-indigo-500/20 shadow-lg transition-all hover:shadow-indigo-500/30">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-6">Video Preview</h2>
              <div className="relative flex justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  muted={isMuted}
                  className="w-full max-w-3xl rounded-lg border-2 border-indigo-500/50 shadow-lg transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <button
                    onClick={toggleMute}
                    className="px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all shadow-md"
                    aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    onClick={startVideoCall}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 text-white font-semibold hover:from-green-600 hover:to-cyan-600 transition-all shadow-md"
                    aria-label="Start video call"
                  >
                    Start Call
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Section: Friends and Participants */}
          <aside className="lg:w-1/3 space-y-8">
            {/* Invite Friends Card */}
            <section className="bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 border border-indigo-500/20 shadow-lg transition-all hover:shadow-indigo-500/30">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Invite Friends
              </h2>
              {inviteError && (
                <p className="mb-4 text-red-400 bg-red-900/20 p-3 rounded-lg text-sm font-medium">
                  {inviteError}
                </p>
              )}
              {friends.length > 0 ? (
                <ul className="space-y-4">
                  {friends.map((friend) => (
                    <li
                      key={friend.user_id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700/70 transition-all"
                    >
                      {friend.profile_photo ? (
                        <img
                          src={`http://localhost:8000${friend.profile_photo}`}
                          alt={`${friend.username}'s profile`}
                          className="w-10 h-10 rounded-full object-cover border border-indigo-500/50"
                          onError={(e) => (e.currentTarget.src = '/fallback-profile.jpg')}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold border border-indigo-500/50">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="block text-gray-200 font-medium">{friend.username}</span>
                        <span className="text-sm text-gray-400">{friend.email}</span>
                      </div>
                      <button
                        onClick={() => handleInviteFriend(friend)}
                        className="px-4 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all"
                        aria-label={`Invite ${friend.username} to room`}
                      >
                        Invite
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">No friends to invite yet</p>
              )}
            </section>

            {/* Participants Card */}
            <section className="bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 border border-indigo-500/20 shadow-lg transition-all hover:shadow-indigo-500/30">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Participants</h2>
              {room.participants.length > 0 ? (
                <ul className="space-y-3">
                  {room.participants.map((participant, index) => (
                    <li
                      key={index}
                      className="p-3 rounded-lg bg-gray-700/50 text-gray-200 hover:bg-gray-700/70 transition-all"
                    >
                      {participant}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">No participants yet</p>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default RoomDetail;