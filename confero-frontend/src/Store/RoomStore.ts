import { create } from 'zustand';
import { fetchPublicRooms, fetchUserRooms, createRoom, updateRoom, deleteRoom, Room } from '../api/room';

interface RoomState {
  publicRooms: Room[];
  userRooms: Room[];
  fetchPublicRooms: () => Promise<void>;
  fetchUserRooms: () => Promise<void>;
  createRoom: (roomData: Partial<Room> | FormData) => Promise<Room>;
  updateRoom: (roomId: number, roomData: Partial<Room>) => Promise<void>;
  deleteRoom: (roomId: number) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set) => ({
  publicRooms: [],
  userRooms: [],
  fetchPublicRooms: async () => {
    try {
      const rooms = await fetchPublicRooms();
      set({ publicRooms: rooms });
    } catch (error) {
      console.error('Failed to fetch public rooms:', error);
      throw error;
    }
  },
  fetchUserRooms: async () => {
    try {
      const rooms = await fetchUserRooms();
      set({ userRooms: rooms });
    } catch (error) {
      console.error('Failed to fetch user rooms:', error);
      throw error;
    }
  },
  createRoom: async (roomData) => {
    try {
      const newRoom = await createRoom(roomData);
      set((state) => ({
        userRooms: [...state.userRooms, newRoom],
        publicRooms: newRoom.visibility === 'public' ? [...state.publicRooms, newRoom] : state.publicRooms,
      }));
      return newRoom;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  },
  updateRoom: async (roomId, roomData) => {
    try {
      const updatedRoom = await updateRoom(roomId, roomData);
      set((state) => ({
        userRooms: state.userRooms.map((room) => (room.id === roomId ? updatedRoom : room)),
        publicRooms: state.publicRooms.map((room) => (room.id === roomId ? updatedRoom : room)),
      }));
    } catch (error) {
      console.error('Failed to update room:', error);
      throw error;
    }
  },
  deleteRoom: async (roomId) => {
    try {
      await deleteRoom(roomId);
      set((state) => ({
        userRooms: state.userRooms.filter((room) => room.id !== roomId),
        publicRooms: state.publicRooms.filter((room) => room.id !== roomId),
      }));
    } catch (error) {
      console.error('Failed to delete room:', error);
      throw error;
    }
  },
}));

// Selectors for performance
export const selectPublicRooms = (state: RoomState) => state.publicRooms;
export const selectUserRooms = (state: RoomState) => state.userRooms;