import { create } from "zustand";
import { createRoom, fetchRooms, updateRoom, fetchPublicRooms, joinRoom } from "../api/room";

interface Room {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    visibility: "public" | "private";
  creator_id: number;
  creator_email: string;
  invited_users: string[];
  thumbnail: string | null;
  participants: string[];
  created_at: string;
  updated_at: string;
}

interface PublicRoom {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    creator_email: string;
    thumbnail: string | null;
    participants: string[];
    created_at: string;
}

interface RoomState {
    rooms: Room[];
    publicRooms: PublicRoom[];
    isLoadingRooms: boolean;
    errorRooms: string | null;
  
    createRoom: (data: { name: string; description?: string; visibility: "public" | "private"; invited_users?: string[]; thumbnail?: File }) => Promise<void>;
    fetchRooms: () => Promise<void>;
    updateRoom: (slug: string, data: { name?: string; description?: string; visibility?: "public" | "private"; invited_users?: string[]; thumbnail?: File }) => Promise<void>;
    fetchPublicRooms: () => Promise<void>;
    joinRoom: (slug: string) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set, get) => ({
    rooms: [],
    publicRooms: [],
    isLoadingRooms: false,
    errorRooms: null,
  
    createRoom: async (data) => {
      set({ isLoadingRooms: true, errorRooms: null });
      try {
        const newRoom = await createRoom(data);
        set((state) => ({
          rooms: [...state.rooms, newRoom],
          isLoadingRooms: false,
        }));
        await get().fetchPublicRooms();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create room";
        set({ errorRooms: errorMessage, isLoadingRooms: false });
        throw error;
      }
    },
  
    fetchRooms: async () => {
      set({ isLoadingRooms: true, errorRooms: null });
      try {
        const rooms = await fetchRooms();
        set({ rooms, isLoadingRooms: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch rooms";
        set({ errorRooms: errorMessage, isLoadingRooms: false });
        throw error;
      }
    },
  
    updateRoom: async (slug, data) => {
      set({ isLoadingRooms: true, errorRooms: null });
      try {
        const updatedRoom = await updateRoom(slug, data);
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.slug === slug ? updatedRoom : room
          ),
          isLoadingRooms: false,
        }));
        await get().fetchPublicRooms();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update room";
        set({ errorRooms: errorMessage, isLoadingRooms: false });
        throw error;
      }
    },
  
    fetchPublicRooms: async () => {
      set({ isLoadingRooms: true, errorRooms: null });
      try {
        const publicRooms = await fetchPublicRooms();
        set({ publicRooms, isLoadingRooms: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch public rooms";
        set({ errorRooms: errorMessage, isLoadingRooms: false });
        throw error;
      }
    },
  
    joinRoom: async (slug) => {
      set({ isLoadingRooms: true, errorRooms: null });
      try {
        await joinRoom(slug);
        await get().fetchPublicRooms();
        set({ isLoadingRooms: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to join room";
        set({ errorRooms: errorMessage, isLoadingRooms: false });
        throw error;
      }
    },
  }));