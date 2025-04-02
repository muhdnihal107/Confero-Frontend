import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../api/room"; // Adjust API import path
import { useAuthStore } from "../Store/authStore";

const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "public",
    thumbnail: null as File | null,
  });
  console.log(formData,'create')
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({ ...prev, thumbnail: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError("You must be logged in to create a room.");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("visibility", formData.visibility);
    if (formData.thumbnail) data.append("thumbnail", formData.thumbnail);

    try {
      await createRoom(accessToken, data);
      navigate("/room");
    } catch (err) {
      setError("Failed to create room. Please try again.");
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#030103a8] text-white">
      <div className="flex flex-col min-h-screen pt-20 px-6 sm:px-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-8">
          Create a New Room
        </h1>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-gray-800/90 p-8 rounded-xl shadow-lg border border-gray-700">
          {error && <p className="text-red-400 mb-4">{error}</p>}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-indigo-400 mb-2">Room Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-lg font-semibold text-indigo-400 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
            />
          </div>
          <div className="mb-6">
            <label className="block text-lg font-semibold text-indigo-400 mb-2">Visibility</label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-lg font-semibold text-indigo-400 mb-2">Thumbnail</label>
            <input
              type="file"
              name="thumbnail"
              onChange={handleFileChange}
              className="w-full p-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              accept="image/*"
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 rounded-full shadow-md font-medium transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            Create Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;