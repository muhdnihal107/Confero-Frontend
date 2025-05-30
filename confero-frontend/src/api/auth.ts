import axios, { AxiosError } from "axios";
import { useAuthStore } from "../Store/authStore";

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

export interface ProfileResponse {
  user_id: number;
  email: string;
  username: string | null;
  phone_number: string | null; // Updated to match backend
  bio: string | null;
  profile_photo: string | null;
}

export interface Profile {
  user_id: number;
  email: string;
  username: string | null;
  age: number | null;
  phone_number: string | null;
  profile_photo: string | null;
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

//--------------------------------------------------------------------------------------------------

export const fetchProfile = async (): Promise<ProfileResponse> => {
  try {
    const response = await api.get<ProfileResponse>("profile/");
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
    console.log(formData,'dddddddddddddd');
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
//-----------------------------------------------------------------------------------------
export const sendFriendRequest = async (user_id: number) => {
  try {
    console.log(user_id);
    const response = await api.post("/friend-request/", { receiver_id : user_id });
    console.log(response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to sendfriend request");
  }
};
//----------------------------------------------------------------------------------------------
export const handleFriendRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
  try {
    const response = await api.post(`/friend-request/${requestId}/action/`, { action });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string }>;
    throw new Error(axiosError.response?.data?.error || `Failed to ${action} friend request`);
  }
};

//----------------------------------------------------------------------------------------------
export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  try {
    const response = await axios.post<{ message: string }>(`${API_URL}forgot-password/`, { email });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to request password reset");
  }
};

//---------------------------------------------------------------------------------------

export const resetPassword = async (token: string, new_password: string): Promise<{ message: string }> => {
  try {
    const response = await axios.post<{ message: string }>(`${API_URL}reset-password/${token}`,{token,new_password} );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to reset password");
  }
};

//---------------------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------------------

export const fetchAllProfiles = async (): Promise<ProfileResponse[]> => {
  try {
    const response = await api.get<ProfileResponse[]>("profilelist/");
    console.log("All profiles:", response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to fetch all profiles");
  }
};


export const fetchFriends = async (): Promise<ProfileResponse[]> => {
  try {
    const response = await api.get<ProfileResponse[]>("fetch-friends/");
    console.log(response.data,'fetch friends')
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to fetch all profiles");
  }
};


export const fetchStrangers = async (): Promise<ProfileResponse[]> => {
  try {
    const response = await api.get<ProfileResponse[]>("fetch-strangers/");
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to fetch all profiles");
  }
};


export const fetchFriendCount = async (): Promise<{ friend_count: number }> => {
  try {
    const response = await api.get<{ friend_count: number }>("/friend-count/");
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    throw new Error(axiosError.response?.data?.detail || "Failed to fetch friend count");
  }
};