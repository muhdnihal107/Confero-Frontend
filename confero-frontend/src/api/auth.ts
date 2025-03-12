import axios from "axios";
import { useAuthStore } from "../store";
import { AxiosError } from "axios";

const api = axios.create({
    baseURL: 'http://localhost:8000/api/auth/',
    headers: { 'Content-Type': 'application/json' },
  });

  api.interceptors.request.use((config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  }, (error) => Promise.reject(error))

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post('login/', { email, password });
    const { refresh, access } = response.data;
    useAuthStore.getState().setTokens(access, refresh); // Store tokens
    return response.data; // { refresh, access }
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || 'Login failed');
  }
};

export const registerUser = async (data: {
  email: string;
  password: string;
  display_name: string;
  age?: number;
  phone_number?: string;
}) => {
  try {
    const response = await api.post('register/', data);
    const { refresh, access } = response.data; // Assuming register returns tokens
    if (refresh && access) {
      useAuthStore.getState().setTokens(access, refresh); // Store tokens
    }
    return response.data; // { refresh, access } or { detail: "User created" }
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || 'Registration failed');
  }
};

export const fetchProfile = async () => {
  try {
    const response = await api.get('profile/');
    useAuthStore.getState().setUser(response.data); // Store user data
    return response.data; // { id, email, age, phone_number, display_name, profile_picture }
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || 'Failed to fetch profile');
  }
}
