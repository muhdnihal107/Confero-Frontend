import axios from 'axios';
import { useAuthStore } from '../Store/authStore';

const API_URL = 'http://localhost:8001/api/';

export interface Room {
  id: number;
  creator_id: number;
  creator_email: string;
  name: string;
  slug: string;
  description?: string;
  visibility: 'public' | 'private';
  invited_users: string[];
  thumbnail?: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}

// Create Axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('No accessToken found in store');
  }
  return config;
});

// Fetch all public rooms (no token required)
export const fetchPublicRooms = async (): Promise<Room[]> => {
  const response = await api.get('public-rooms/');
  return response.data;
};

// Fetch user's rooms (requires token)
export const fetchUserRooms = async (): Promise<Room[]> => {
  const response = await api.get('/rooms/');
  return response.data;
};

export const fetchRoomDetails = async (roomId: string): Promise<Room> => {
  try {
    const response = await api.get(`room/${roomId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching room details:', error);
    throw error;
  }
};

// Create a room (supports both JSON and FormData)
export const createRoom = async (roomData: Partial<Room> | FormData): Promise<Room> => {
  console.log('Sending request to create room with:', roomData instanceof FormData ? 'FormData' : roomData);
  const config = roomData instanceof FormData ? {headers: { 'Content-Type': 'multipart/form-data' }} : { headers: { 'Content-Type': 'application/json' } };
  const response = await api.post('/rooms/', roomData, config);
  console.log(response,'ppppppppp');
  return response.data;
}

// Update a room
export const updateRoom = async (roomId: number, roomData: Partial<Room>): Promise<Room> => {
  const response = await api.put(`/rooms/${roomId}/`, roomData);
  return response.data;
};

// Delete a room
export const deleteRoom = async (roomId: number): Promise<void> => {
  await api.delete('/rooms/', { data: { id: roomId } });
};

// WebSocket connection
export const connectToRoomWebSocket = (roomId: number, onMessage: (event: MessageEvent) => void): WebSocket => {
  const token = useAuthStore.getState().accessToken;
  const ws = new WebSocket(`ws://localhost:8001/ws/room/${roomId}/?token=${token}`);

  ws.onopen = () => console.log(`Connected to room ${roomId} WebSocket`);
  ws.onmessage = onMessage;
  ws.onerror = (error) => console.error('WebSocket error:', error);
  ws.onclose = () => console.log(`Disconnected from room ${roomId} WebSocket`);

  return ws;
};

// Send WebRTC signaling data
export const sendWebRTCSignal = (ws: WebSocket, type: string, data: any, target?: string): void => {
  ws.send(JSON.stringify({ type, data, target }));
};