import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../Store/authStore';

const API_URL = 'http://localhost:8001/api/';
const WS_URL = 'ws://localhost:8001';

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

export interface WebRTCSignal {
  type: 'webrtc_offer' | 'webrtc_answer' | 'ice_candidate' | 'chat_message';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit | string;
  target?: string;
  sender: string;
}

interface ApiError {
  message: string;
  status?: number;
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No accessToken found in store');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'An error occurred',
      status: error.response?.status,
    };
    if (error.response?.status === 401) {
      apiError.message = 'Unauthorized: Please log in again';
    } else if (error.response?.status === 403) {
      apiError.message = 'Forbidden: You lack permission';
    } else if (error.response?.status === 404) {
      apiError.message = 'Resource not found';
    }
    console.error(`API error: ${apiError.message}`, error);
    return Promise.reject(apiError);
  }
);

export const fetchPublicRooms = async (): Promise<Room[]> => {
  try {
    const response = await api.get('public-rooms/');
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error fetching public rooms:', apiError.message);
    throw apiError;
  }
};

export const fetchUserRooms = async (): Promise<Room[]> => {
  try {
    const response = await api.get('/rooms/');
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error fetching user rooms:', apiError.message);
    throw apiError;
  }
};

export const fetchRoomDetails = async (roomId: string): Promise<Room> => {
  try {
    const response = await api.get(`room/${roomId}/`);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error(`Error fetching room ${roomId} details:`, apiError.message);
    throw apiError;
  }
};

export const roomInvite = async (
  email: string,
  receiver_id: number,
  room_id: number
): Promise<{ message: string }> => {
  try {
    console.log(`${email}-email--${receiver_id}-receiverID,--${room_id}-roodID`);
    const response = await api.post(`rooms/${room_id}/invite/`, { receiver_id, email });
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error(`Error inviting ${email} to room ${room_id}:`, apiError.message);
    throw apiError;
  }
};

export const acceptRoomInvite = async (room_id: number): Promise<{ message: string }> => {
  try {
    const response = await api.post(`rooms/${room_id}/accept/`);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error(`Error accepting invite for room ${room_id}:`, apiError.message);
    throw apiError;
  }
};

export const joinRoom = async (room_id: number): Promise<{ message: string }> => {
  try {
    const response = await api.post(`rooms/${room_id}/join/`);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error(`Error accepting invite for room ${room_id}:`, apiError.message);
    throw apiError;
  }
};


export const createRoom = async (roomData: Partial<Room> | FormData): Promise<Room> => {
  try {
    console.log('Sending request to create room with:', roomData instanceof FormData ? 'FormData' : roomData);
    const config = roomData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : { headers: { 'Content-Type': 'application/json' } };
    const response = await api.post('/rooms/', roomData, config);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error creating room:', apiError.message);
    throw apiError;
  }
};

export const updateRoom = async (roomId: number, roomData: Partial<Room>): Promise<Room> => {
  try {
    const response = await api.put(`/update-room/${roomId}/`, roomData);
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error(`Error updating room ${roomId}:`, apiError.message);
    throw apiError;
  }
};

export const deleteRoom = async (roomId: number): Promise<void> => {
  try {
    await api.delete(`/rooms/${roomId}/`);
  } catch (error) {
    const apiError = error as ApiError;
    console.error(`Error deleting room ${roomId}:`, apiError.message);
    throw apiError;
  }
};

export const connectToRoomWebSocket = (
  roomId: number,
  options: {
    onMessage: (event: MessageEvent) => void;
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (error: Event) => void;
  }
): WebSocket => {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  let ws: WebSocket | null = null;

  const connect = () => {
    try {
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        console.error('No access token for WebSocket connection');
        options.onError?.(new Event('NoToken'));
        throw new Error('No access token');
      }

      ws = new WebSocket(`${WS_URL}/ws/room/${roomId}/?token=${token}`);
      console.log(`Connecting to room ${roomId} WebSocket`);

      ws.onopen = () => {
        console.log(`Connected to room ${roomId} WebSocket`);
        reconnectAttempts = 0;
        options.onOpen?.();
      };

      ws.onmessage = options.onMessage;

      ws.onerror = (error) => {
        console.error(`WebSocket error for room ${roomId}:`, error);
        options.onError?.(error);
      };

      ws.onclose = (event) => {
        console.log(
          `Disconnected from room ${roomId} WebSocket, code: ${event.code}, reason: ${event.reason}`
        );
        options.onClose?.(event);

        if (reconnectAttempts < maxReconnectAttempts && event.code !== 1000) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          console.log(
            `Reconnecting to room ${roomId} in ${delay}ms (attempt ${reconnectAttempts + 1})`
          );
          reconnectAttempts++;
          setTimeout(connect, delay);
        } else if (event.code !== 1000) {
          console.error(`Max reconnect attempts (${maxReconnectAttempts}) reached for room ${roomId}`);
        }
      };
    } catch (error) {
      console.error(`Failed to initialize WebSocket for room ${roomId}:`, error);
      options.onError?.(error as Event);
    }
  };

  connect();
  return ws!;
};

export const sendWebRTCSignal = (
  ws: WebSocket,
  type: WebRTCSignal['type'],
  data: WebRTCSignal['data'],
  target: string,
  sender: string
): void => {
  const signal: WebRTCSignal = { type, data, target, sender };
  const trySend = () => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(signal));
        console.log(`Sent ${type} signal to ${target} from ${sender}`);
      } else {
        console.warn(
          `WebSocket not ready (state: ${ws.readyState}) for ${type} signal to ${target} from ${sender}`
        );
        setTimeout(trySend, 500);
      }
    } catch (error) {
      console.error(`Failed to send ${type} signal to ${target} from ${sender}:`, error);
    }
  };
  trySend();
};

export const closeWebSocket = (ws: WebSocket | null): void => {
  if (ws && ws.readyState !== WebSocket.CLOSED) {
    ws.close(1000, 'Manual close');
    console.log('WebSocket closed manually');
  }
};