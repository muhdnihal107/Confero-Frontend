import axios, { AxiosError } from "axios";
import { useAuthStore } from "../Store/store";

const API_URL = "http://localhost:8000/api/auth/";

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

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

interface ProfileResponse {
  email: string;
  username: string | null;
  age: number | null;
  Phone_number: string | null;
  Profile_photo?: string | null; // Match backend field name (lowercase)
}

export const loginUser = async (email: string, password: string): Promise<TokenResponse> => {
  try {
    const response = await axios.post<TokenResponse>(`${API_URL}login/`, { email, password });
    console.log(response.data,'hhh');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Login failed");
  }
};

export const registerUser = async (data: {
  email: string;
  password: string;
  username: string;
  age?: number;
  Phone_number?: string;
}): Promise<TokenResponse> => {
  try {
    const response = await axios.post<TokenResponse>(`${API_URL}register/`, data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Registration failed");
  }
};

export const fetchProfile = async (): Promise<ProfileResponse> => {
  try {
    const response = await api.get<ProfileResponse>("profile/");
    console.log(response.data,'lll');
    return response.data;

  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to fetch profile");
  }
};


export const updateProfile = async (data: {
  Phone_number?: string;
  Profile_photo?: File | null;
}): Promise<ProfileResponse> => {
  try {
    const formData = new FormData();
    if (data.Phone_number) {
      formData.append('Phone_number', data.Phone_number);
    }
    if (data.Profile_photo) {
      formData.append('Profile_photo', data.Profile_photo);
    }
    const response = await api.put<ProfileResponse>('profile/', formData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || 'Failed to update profile');
  }
};