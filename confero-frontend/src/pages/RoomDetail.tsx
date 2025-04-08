// src/pages/RoomDetail.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchRoomDetails, updateRoom, Room } from '../api/room';

const RoomDetail: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoom, setEditedRoom] = useState({ name: '', description: '', visibility: 'public' as const });
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const userId = parseInt(localStorage.getItem('user_id') || '0');

  // Fetch room details
  useEffect(() => {
    const loadRoom = async () => {
      if (!room_id) return;
      try {
        const roomData = await fetchRoomDetails(room_id);
        setRoom(roomData);
        setEditedRoom({
          name: roomData.name,
          description: roomData.description,
          visibility: roomData.visibility,
        });
      } catch (error) {
        console.error('Failed to load room:', error);
      }
    };
    loadRoom();
  }, [room_id]);

  // Setup video preview
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
    alert('Starting video call... (Implement WebRTC logic here)');
  };

  if (!room) return <div className="text-center text-xl text-gray-300 p-10 animate-pulse">Loading...</div>;

  const isCreator = userId === room.creator_id;

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-[#03010392] to-[#1a1625] text-white overflow-hidden">
      <div className="flex flex-row min-h-screen pt-24 px-6 sm:px-12 gap-8">
        {/* Left Side: Room Details and Video */}
        <div className="w-3/4">
          <div className="bg-gray-900/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-700/30 mb-8">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6 animate-slideInLeft">
              {room.name}
            </h1>

            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editedRoom.name}
                    onChange={(e) => setEditedRoom({ ...editedRoom, name: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={editedRoom.description}
                    onChange={(e) => setEditedRoom({ ...editedRoom, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-24 transition-all duration-200"
                    placeholder="Describe your room"
                  />
                </div>
                <div>
                  <label htmlFor="visibility" className="block text-sm font-medium text-gray-300 mb-1">
                    Visibility
                  </label>
                  <select
                    id="visibility"
                    value={editedRoom.visibility}
                    onChange={(e) => setEditedRoom({ ...editedRoom, visibility: e.target.value as 'public' | 'private' })}
                    className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-full bg-gray-700 text-white font-semibold hover:bg-gray-600 transform hover:scale-105 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-200 leading-relaxed">
                  {room.description || 'No description available'}
                </p>
                <p className="text-gray-300">
                  <strong className="text-indigo-300">Visibility:</strong> {room.visibility}
                </p>
                <p className="text-gray-300">
                  <strong className="text-indigo-300">Creator:</strong> {room.creator_email}
                </p>
                {isCreator && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300"
                  >
                    Edit Room
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Video Preview */}
          <div className="bg-gray-900/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-700/30 text-center">
            <video ref={videoRef} autoPlay muted={isMuted} className="w-full max-w-lg rounded-lg mb-6 shadow-md" />
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleMute}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300"
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={startVideoCall}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 text-white font-semibold hover:from-green-600 hover:via-teal-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-300"
              >
                Start Video Call
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Friends and Participants */}
        <div className="w-1/4 fixed top-24 right-6 h-[calc(100vh-6rem)] z-10">
          <div className="bg-gray-900/20 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-gray-700/30 h-full overflow-y-auto">
            <div className="mb-8">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Invite Friends
              </h2>
              <p className="mt-4 text-gray-300">(Add your friend fetch and invite logic here)</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-indigo-300">Participants</h2>
              {room.participants.length > 0 ? (
                <ul className="mt-4 text-gray-300 space-y-2">
                  {room.participants.map((participantId) => (
                    <li
                      key={participantId}
                      className="hover:text-indigo-200 transition-colors duration-200"
                    >
                      User ID: {participantId}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-gray-400">No participants yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;