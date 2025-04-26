import axios from 'axios';
import { AxiosError } from 'axios';
import { useAuthStore } from '../Store/authStore';
export interface ChatGroup {
    id: string;
    name?: string;
    is_group_chat: boolean;
    participants: string[];
    created_at: string;
    updated_at: string;
  }
  
  export interface Message {
    id: string;
    chat_group: string;
    sender_email: string;
    message_type: 'text' | 'image' | 'video';
    content?: string;
    media_file?: string;
    created_at: string;
    read_by: string[];
  }

const API_URL = 'http://localhost:8002/api/chats/';


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

export const fetchChatGroups = async (token: string): Promise<ChatGroup[]> => {
  try {
    const response = await api.get<ChatGroup[]>('/groups/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || 'Failed to fetch chat groups');
  }
};

export const fetchMessages = async (groupId: string, token: string): Promise<Message[]> => {
  try {
    console.log(groupId,'lolo')
    const response = await api.get<Message[]>(`/messages/?chat_group=${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(response.data)
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || 'Failed to fetch messages');
  }
};

export const createChatGroup = async (data: { is_group_chat: boolean; participants: string[] }, token: string): Promise<ChatGroup> => {
  try {
    const response = await api.post<ChatGroup>('/groups/', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || 'Failed to create chat group');
  }
};



export const updateChatGroup = async (
  groupId: string,
  data: { name?: string; participants?: string[] },
  token: string
): Promise<ChatGroup> => {
  try {
    const response = await api.patch<ChatGroup>(`/groups/${groupId}/`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || 'Failed to update chat group');
  }
};




export const sendMessage = async (data: { chat_group: string; message_type: 'text' | 'image' | 'video'; content?: string; media_file?: File }, token: string): Promise<Message> => {
  try {
    const formData = new FormData();
    formData.append('chat_group', data.chat_group);
    formData.append('message_type', data.message_type);
    if (data.content) formData.append('content', data.content);
    if (data.media_file) formData.append('media_file', data.media_file);
    const response = await api.post<Message>('/messages/', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || 'Failed to send message');
  }

};