import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../Store/RoomStore';
import { useAuthStore } from '../../Store/authStore';
import Header from '../../components/Header';

interface RoomFormData {
  name: string;
  description: string;
  visibility: 'public' | 'private';
  creator_email: string;
  thumbnail: File | null;
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
        thumbnail: formData.thumbnail,
      };
      console.log(roomData,'nnnnnnnnnnnnn')
      let newRoom;
      if (formData.thumbnail) {
        const form = new FormData();
        form.append('name', roomData.name);
        form.append('description', roomData.description);
        form.append('visibility', roomData.visibility);
        form.append('creator_email', roomData.creator_email);
        form.append('thumbnail', formData.thumbnail);

        console.log('Submitting FormData with thumbnail:');
        for (const [key, value] of form.entries()) {
          console.log(`${key}: ${value instanceof File ? `${value.name} (${value.size} bytes, ${value.type})` : value}`);
        }
        newRoom = await createRoom(form);
      } else {
        console.log('Submitting JSON data:', roomData);
        newRoom = await createRoom(roomData);
      }

      console.log('Room created successfully');
      const roomId = newRoom.id;
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
    <div className="min-h-screen bg-[#030103a8] flex flex-col">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 mt-6">
        <div className="w-full max-w-md bg-[#00000066] backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 transform transition-all duration-500 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Create a New Room
          </h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 rounded-lg text-red-300 text-center text-sm font-medium animate-pulse">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Room Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Room Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                placeholder="Enter room name"
                required
              />
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24 transition-all duration-300"
                placeholder="Describe your room (optional)"
              />
            </div>
            
            {/* Visibility */}
            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-300 mb-1">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 appearance-none bg-right bg-no-repeat"
                style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"white\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')" }}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            
            {/* Thumbnail */}
            <div>
              <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-300 mb-1">
                Thumbnail (optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="thumbnail"
                  name="thumbnail"
                  onChange={handleFileChange}
                  className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white file:hover:bg-indigo-700 transition-all duration-300"
                  accept="image/jpeg,image/png"
                />
                {formData.thumbnail && (
                  <p className="mt-2 text-sm text-gray-400 truncate">
                    Selected: {formData.thumbnail.name}
                  </p>
                )}
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Room
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateRoom;