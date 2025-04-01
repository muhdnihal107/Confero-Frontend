import { useEffect, useState } from "react";
import { useRoomStore } from "../Store/RoomStore";

interface Room {
  id: number;
  name: string;
  slug: string;
  description: string;
  visibility: string;
  invited_users: string[];
  thumbnail?: string;
}

const RoomComponent = () => {
  const { rooms, fetchRooms, createRoom, updateRoom } = useRoomStore();
  const [newRoom, setNewRoom] = useState({ name: "", description: "", visibility: "public" });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [token] = useState(localStorage.getItem("token") || "");

  useEffect(() => {
    if (token) fetchRooms(token);
  }, [token, fetchRooms]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setThumbnail(event.target.files[0]);
    }
  };

  const handleCreateRoom = async () => {
    if (!token) return alert("User not authenticated");

    const formData = new FormData();
    formData.append("name", newRoom.name);
    formData.append("description", newRoom.description);
    formData.append("visibility", newRoom.visibility);
    if (thumbnail) formData.append("thumbnail", thumbnail);

    await createRoom(token, formData);
    setNewRoom({ name: "", description: "", visibility: "public" });
    setThumbnail(null);
  };

  const handleUpdateRoom = async (roomId: number) => {
    if (!token) return alert("User not authenticated");

    const updatedData = new FormData();
    updatedData.append("name", "Updated Room Name"); // Example update
    if (thumbnail) updatedData.append("thumbnail", thumbnail);

    await updateRoom(token, roomId, updatedData);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Rooms</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Room Name"
          value={newRoom.name}
          onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Description"
          value={newRoom.description}
          onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
          className="border p-2 mr-2"
        />
        <select
          value={newRoom.visibility}
          onChange={(e) => setNewRoom({ ...newRoom, visibility: e.target.value })}
          className="border p-2 mr-2"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <input type="file" onChange={handleFileChange} className="border p-2" />
        <button onClick={handleCreateRoom} className="bg-blue-500 text-white p-2">Create Room</button>
      </div>

      <ul>
        {rooms.map((room) => (
          <li key={room.id} className="border p-2 my-2 flex justify-between">
            <div>
              {room.thumbnail && <img src={room.thumbnail} alt={room.name} className="w-16 h-16 mr-2" />}
              <span>{room.name} - {room.description}</span>
            </div>
            <button onClick={() => handleUpdateRoom(room.id)} className="bg-green-500 text-white p-1">
              Update
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomComponent;
