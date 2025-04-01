import { create } from "zustand";
import { fetchRooms, createRoom, updateRoom, fetchPublicRooms } from "../api/room";

interface Room {
  id: number;
  name: string;
  slug: string;
  description: string;
  visibility: string;
  invited_users: string[];
  thumbnail?: string;
  participants: string[];
}

interface RoomStore {
  rooms: Room[];
  publicRooms: Room[];
  fetchRooms: (token: string) => Promise<void>;
  createRoom: (token: string, roomData: FormData) => Promise<void>;
  updateRoom: (token: string, roomId: number, updatedData: FormData) => Promise<void>;
  fetchPublicRooms: () => Promise<void>;
}

export const useRoomStore = create<RoomStore>((set) => ({
  rooms: [],
  publicRooms: [],

  fetchRooms: async (token) => {
    try {
      const data = await fetchRooms(token);
      set({ rooms: data });
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  },

  createRoom: async (token, roomData) => {
    try {
      const newRoom = await createRoom(token, roomData);
      set((state) => ({ rooms: [...state.rooms, newRoom] }));
    } catch (error) {
      console.error("Error creating room:", error);
    }
  },

  updateRoom: async (token, roomId, updatedData) => {
    try {
      const updatedRoom = await updateRoom(token, roomId, updatedData);
      set((state) => ({
        rooms: state.rooms.map((room) => (room.id === roomId ? updatedRoom : room)),
      }));
    } catch (error) {
      console.error("Error updating room:", error);
    }
  },

  fetchPublicRooms: async () => {
    try {
      const data = await fetchPublicRooms();
      set({ publicRooms: data });
    } catch (error) {
      console.error("Error fetching public rooms:", error);
    }
  },
}));
