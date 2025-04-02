import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRooms, fetchPublicRooms } from "../api/room";
import { useAuthStore } from "../Store/authStore";
import Header from "../components/Header";

const Rooms: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true);
      try {
        if (accessToken) {
          const publicRooms = await fetchPublicRooms();
          setRooms([...publicRooms]);
        } else {
          const publicRooms = await fetchPublicRooms();
          setRooms(publicRooms);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRooms();
  }, [accessToken]);

  const handleRoomHover = (room: any) => setSelectedRoom(room);
  const handleRoomLeave = () => setSelectedRoom(null);

  return (
    <div
      className="relative w-full min-h-screen bg-gradient-to-b from-[#03010392] to-[#1a1625] text-white overflow-hidden"
      
    >
      <Header />
      <div className="flex flex-row min-h-screen pt-24 px-6 sm:px-12 gap-8">
        {/* Fixed Sidebar */}
        <div className="w-1/4 pr-6 fixed top-24 left-6 h-[calc(100vh-6rem)] z-10">
          <div className="bg-gray-900/20 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-gray-700/30 transform transition-all duration-500 ease-in-out h-full overflow-y-auto">
            {selectedRoom ? (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {selectedRoom.name}
                </h2>
                <p className="mt-4 text-gray-200 leading-relaxed">{selectedRoom.description || "No description available"}</p>
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-indigo-300">Participants</h3>
                  <ul className="mt-2 text-gray-300 space-y-1">
                    {selectedRoom.participants.length > 0 ? (
                      selectedRoom.participants.map((participant: string, index: number) => (
                        <li key={index} className="hover:text-indigo-200 transition-colors duration-200">
                          {participant}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400">No participants yet</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center animate-pulse">Hover over a room to see details</p>
            )}
          </div>
        </div>

        {/* Main Room List */}
        <div className="w-3/4 ml-[25%]">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-slideInLeft">
              Rooms
            </h1>
            <button
              onClick={() => navigate("/create-room")}
              className="px-6 py-3 rounded-full shadow-lg font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 ease-in-out"
            >
              Create Room
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-300 text-lg animate-pulse">Loading rooms...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="group bg-gray-900/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-700/30 hover:shadow-2xl hover:border-indigo-500/50 transform hover:-translate-y-2 transition-all duration-300 ease-in-out"
                  onMouseEnter={() => handleRoomHover(room)}
                  onMouseLeave={handleRoomLeave}
                >
                  {room.thumbnail ? (
                    <img
                      src={`http://localhost:8001${room.thumbnail}`}
                      alt={room.name}
                      className="w-full h-40 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-700/50 rounded-lg mb-4 flex items-center justify-center group-hover:bg-gray-600/50 transition-colors duration-300">
                      <span className="text-gray-400">No Thumbnail</span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors duration-200">
                    {room.name}
                  </h3>
                  <p className="mt-2 text-gray-300 truncate group-hover:text-gray-200 transition-colors duration-200">
                    {room.description || "No description"}
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    Started: {new Date(room.created_at).toLocaleString()}
                  </p>
                  <button className="mt-4 w-full px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 ease-in-out">
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rooms;