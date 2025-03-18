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
  phone_number: string | null; // Updated to match backend
  profile_photo: string | null; // Updated to match backend
}

export const loginUser = async (email: string, password: string): Promise<TokenResponse> => {
  try {
    const response = await axios.post<TokenResponse>(`${API_URL}login/`, { email, password });
    console.log(response.data, "hhh");
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
}): Promise<TokenResponse> => {
  try {
    const response = await axios.post<TokenResponse>(`${API_URL}register/`, data);
    return response.data; // Expect tokens after registration (update backend to return this)
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Registration failed");
  }
};

export const fetchProfile = async (): Promise<ProfileResponse> => {
  try {
    const response = await api.get<ProfileResponse>("profile/");
    console.log(response.data, "lll");
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to fetch profile");
  }
};

export const updateProfile = async (data: {
  phone_number?: string;
  profile_photo?: File | null;
}): Promise<ProfileResponse> => {
  try {
    const formData = new FormData();
    if (data.phone_number) {
      formData.append("phone_number", data.phone_number);
    }
    if (data.profile_photo) {
      formData.append("profile_photo", data.profile_photo);
    }
    const response = await api.put<ProfileResponse>("profile/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to update profile");
  }
};

export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>("forgot-password/", { email });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to request password reset");
  }
};

export const resetPassword = async (data: {
  password: string;
  uid: string;
  token: string;
}): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>("reset-password/", data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to reset password");
  }
};

export const verifyEmail = async (uid: string, token: string): Promise<{ message: string }> => {
  try {
    const response = await api.get<{ message: string }>("verify-email/", {
      params: { uid, token },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Email verification failed");
  }
};