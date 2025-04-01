import axios from "axios";
import { useAuthStore } from "../Store/authStore";
const API_URL = "http://localhost:8000"; // Update with your actual backend URL

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log("No accessToken found in store");
  }
  return config;
});

export const fetchRooms = async (token: string) => {
  const response = await axios.get(`${API_URL}/rooms/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createRoom = async (token: string, roomData: FormData) => {
  const response = await axios.post(`${API_URL}/rooms/`, roomData, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateRoom = async (token: string, roomId: number, updatedData: FormData) => {
  const response = await axios.put(`${API_URL}/rooms/${roomId}/update/`, updatedData, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const fetchPublicRooms = async () => {
  const response = await api.get(`${API_URL}/public-rooms/`);
  return response.data;
};
