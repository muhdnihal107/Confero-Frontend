// src/components/CreateRoom.tsx
import React, { useState } from 'react';
import { createRoom } from '../api/createroom';

const RoomCreate: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        creator_id: 1, // Replace this dynamically if you have auth
        creator_email: 'user5@gmail.com', // Replace dynamically
        name,
        description,
        visibility,
        thumbnail,
      };

      const newRoom = await createRoom(payload);
      console.log('Room created:', newRoom);
      alert('Room created successfully!');
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Create a Room</h2>
      
      <input
        type="text"
        placeholder="Room Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded"
        required
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 rounded"
      />

      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
        className="border p-2 rounded"
      >
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setThumbnail(e.target.files[0]);
          }
        }}
        className="border p-2 rounded"
      />

      <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Create Room
      </button>
    </form>
  );
};

export default RoomCreate;
