import axios, { AxiosError } from "axios";
import { useRoomStore } from "../Store/RoomStore";
import { useAuthStore } from "../Store/authStore";


const API_URL = "http://localhost:8001/api/";

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

interface RoomResponse {
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

interface PublicRoomResponse {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    creator_email: string;
    thumbnail: string | null;
    participants: string[];
    created_at: string;
}

//-----------------------------------------------------------------------------

export const createRoom = async (data: {
    name: string;
    description?: string;
    visibility: "public" | "private";
    invited_users?: string[];
    thumbnail?: File;
}): Promise<RoomResponse> => {
    try {
        const formData = new FormData();
        formData.append("name", data.name);
        if (data.description) formData.append("desscription", data.description);
        formData.append("visibility", data.visibility);
        if (data.invited_users) {
            formData.append("invited_users", JSON.stringify(data.invited_users));
        }
        if (data.thumbnail) {
            formData.append("thumbnail", data.thumbnail);
        }
        const response = await api.post<RoomResponse>("rooms/", formData,{
            headers: { "Content-Type": "multipart/form-data" },          
        });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        throw new Error(axiosError.response?.data?.detail || "Failed to create room");
      }
    
};

//-------------------------------------------------------------------------------------------------------------

export const fetchRooms = async (): Promise<RoomResponse[]> => {
    try{
        const response = await api.get<RoomResponse[]>("rooms/");
        return response.data;
    }catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        throw new Error(axiosError.response?.data?.detail || "Failed to fetch rooms");
      }
};

//---------------------------------------------------------------------------------------------------------

export const updateRoom = async (slug: string, data: {
    name?: string;
    description?: string;
    visibility?: "public" | "private";
    invited_users?: string[];
    thumbnail?: File;
  }): Promise<RoomResponse> => {
    try {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      if (data.visibility) formData.append("visibility", data.visibility);
      if (data.invited_users) {
        formData.append("invited_users", JSON.stringify(data.invited_users));
      }
      if (data.thumbnail) {
        formData.append("thumbnail", data.thumbnail);
      }
      const response = await api.put<RoomResponse>(`rooms/${slug}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      throw new Error(axiosError.response?.data?.detail || "Failed to update room");
    }
  };

//---------------------------------------------------------------------------------------------------------------------------

  export const fetchPublicRooms = async (): Promise<PublicRoomResponse[]> => {
    try {
      const response = await api.get<PublicRoomResponse[]>("public-rooms/");
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      throw new Error(axiosError.response?.data?.detail || "Failed to fetch public rooms");
    }
  };

//---------------------------------------------------------------------------------------------------------------------------

export const joinRoom = async (slug: string): Promise<{ message: string }> => {
    try {
      const response = await api.post<{ message: string }>(`join-room/${slug}/`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      throw new Error(axiosError.response?.data?.detail || "Failed to join room");
    }
};