import { useEffect } from "react";
import { useRoomStore } from "../Store/RoomStore";

const PublicRooms: React.FC = () => {
  const { publicRooms, fetchPublicRooms, isLoadingRooms, errorRooms } = useRoomStore();

  useEffect(() => {
    fetchPublicRooms();
  }, [fetchPublicRooms]);

  if (isLoadingRooms) return <p className="text-center text-white">Loading...</p>;
  if (errorRooms) return <p className="text-center text-red-500">Error: {errorRooms}</p>;

  return (
    <div
      className="flex flex-col items-center min-h-screen px-6 py-12 bg-cover bg-center"
      style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
    >
      <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-4xl">
        <h2 className="text-4xl font-regular text-center text-gray-800 mb-6">Public Rooms</h2>
        {publicRooms.length === 0 ? (
          <p className="text-center text-gray-600">No public rooms available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="p-6 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-800">{room.name}</h3>
                <p className="text-gray-600 mt-2">{room.description || "No description"}</p>
                <p className="text-gray-500 mt-2">Created by: {room.creator_email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicRooms;