import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../Store/RoomStore';
import { useAuthStore } from '../Store/authStore';
import Header from '../components/Header';
interface RoomFormData {
  name: string;
  description: string;
  visibility: 'public' | 'private';
  creator_email: string;
}

const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom } = useRoomStore();
  const { accessToken, user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'private',
    thumbnail: null as File | null,
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      console.log('Selected file:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      setFormData((prev) => ({ ...prev, thumbnail: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !user?.email) {
      setError('You must be logged in to create a room');
      return;
    }

    try {
      const roomData: RoomFormData = {
        name: formData.name,
        description: formData.description,
        visibility: formData.visibility,
        creator_email: user.email,
      };
      let newRoom;
      if (formData.thumbnail) {
        const form = new FormData();
        form.append('name', roomData.name);
        form.append('description', roomData.description);
        form.append('visibility', roomData.visibility);
        form.append('creator_email', roomData.creator_email);
        form.append('thumbnail', formData.thumbnail);

        // Detailed FormData logging
        console.log('Submitting FormData with thumbnail:');
        for (const [key, value] of form.entries()) {
          console.log(`${key}: ${value instanceof File ? `${value.name} (${value.size} bytes, ${value.type})` : value}`);
        }

       newRoom = await createRoom(form);
      } else {
        console.log('Submitting JSON data:', roomData);
        console.log(newRoom,'qqqqqq');
      newRoom=await createRoom(roomData);
      }

      console.log('Room created successfully');
      const roomId = newRoom.id; // Assuming response contains the room ID
      navigate(`/room/${roomId}/`);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        err.message ||
        'Failed to create room';
      setError(errorMessage);
      console.error('Error creating room:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        config: err.config,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#1e203bc0] flex items-center justify-center p-4">
      <Header/>
      <div className="w-full max-w-lg bg-[#616b83bd] backdrop-blur-lg rounded-xl shadow-2xl p-8 transform transition-all duration-300 hover:shadow-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create a New Room</h1>
        {error && (
          <p className="text-red-600 bg-red-100 p-3 rounded-lg mb-6 text-center font-medium">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Room Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
              placeholder="Enter room name"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24 transition-all duration-200"
              placeholder="Describe your room (optional)"
            />
          </div>
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
              Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail (optional)
            </label>
            <input
              type="file"
              id="thumbnail"
              name="thumbnail"
              onChange={handleFileChange}
              className="w-full p-3 rounded-lg border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-200"
              accept="image/jpeg,image/png"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-6 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none transition-all duration-300"
          >
            Create Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;