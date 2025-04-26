// src/api/room.ts
import axios from 'axios';

interface CreateRoomPayload {
  creator_id: number;
  creator_email: string;
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
  invited_users?: string[];  // emails
  participants?: string[];   // emails
  thumbnail?: File | null;
}
const API_URL = 'http://localhost:8001/api/';

export async function createRoom(payload: CreateRoomPayload) {
  const formData = new FormData();
  
  formData.append('creator_id', payload.creator_id.toString());
  formData.append('creator_email', payload.creator_email);
  formData.append('name', payload.name);
  
  if (payload.description) formData.append('description', payload.description);
  if (payload.visibility) formData.append('visibility', payload.visibility);
  if (payload.invited_users) formData.append('invited_users', JSON.stringify(payload.invited_users));
  if (payload.participants) formData.append('participants', JSON.stringify(payload.participants));
  if (payload.thumbnail) formData.append('thumbnail', payload.thumbnail);

  const response = await axios.post(`${API_URL}room-create/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
