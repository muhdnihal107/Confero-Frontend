import { useEffect } from "react";
import { useAuthStore } from "../Store/authStore";
import { useRoomStore } from "../Store/RoomStore";
import { Link, useNavigate } from "react-router-dom";

const Rooms: React.FC = () => {
  const { user } = useAuthStore();
  const { rooms, fetchRooms, isLoadingRooms, errorRooms } = useRoomStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user, fetchRooms]);

  if (!user) {
    navigate("/login");
    return null;
  }

  // if (isLoadingRooms) return <p className="text-center text-white">Loading...</p>;
  // if (errorRooms) return <p className="text-center text-red-500">Error: {errorRooms}</p>;

  return (
    <div
      className="flex flex-col items-center min-h-screen px-6 py-12 bg-cover bg-center"
      style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
    >
      <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-4xl">
        <h2 className="text-4xl font-regular text-center text-gray-800 mb-6">My Rooms</h2>
        {rooms.length === 0 ? (
          <p className="text-center text-gray-600">You haven't created or been invited to any rooms yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-6 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-800">{room.name}</h3>
                <p className="text-gray-600 mt-2">{room.description || "No description"}</p>
                <p className="text-gray-500 mt-2">Visibility: {room.visibility}</p>
                <p className="text-gray-500">Created by: {room.creator_email}</p>
                <div className="mt-4 flex space-x-4">
                  <Link
                    to={`/edit-room/${room.slug}`}
                    className="bg-[#e93a3a] text-white px-4 py-2 rounded-md hover:bg-[#a12121]"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 text-center">
          <Link
            to="/create-room"
            className="bg-[#e93a3a] text-white px-6 py-3 rounded-md hover:bg-[#a12121]"
          >
            Create New Room
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Rooms;