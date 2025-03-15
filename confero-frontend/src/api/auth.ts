import axios from "axios";
import { useAuthStore } from "../Store/store";
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
  }, (error) => Promise.reject(error));

export const loginUser = async (email: string, password: string) => {
  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);
  try {
    const response = await axios.post('http://localhost:8000/api/auth/login/', { email, password });
    const { refresh, access } = response.data;
    console.log("hello",response.data);
    
    useAuthStore.getState().setTokens(access, refresh); // Store tokens
    return response.data; // { refresh, access }
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    const errorMessage = axiosError.response?.data?.detail || 'Login failed';
    setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    setLoading(false);
  }
};

export const registerUser = async (data: {
  email: string;
  password: string;
  username: string;
  age?: number;
  phone_number?: string;
}) => {
  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);
  try {
    const response = await axios.post('http://localhost:8000/api/auth/register/', data);        
    return response.data; // { refresh, access } or { detail: "User created" }
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    const errorMessage = axiosError.response?.data?.detail || 'Registration failed';
    console.log(error);
    
    setError(errorMessage);
    throw new Error(errorMessage);
    }finally {
    setLoading(false);
  }
};

export const fetchProfile = async () => {
  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);
  try {
    const response = await api.get('profile/');
    useAuthStore.getState().setUser(response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    const errorMessage = axiosError.response?.data?.detail || 'Failed to fetch profile';
    setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    setLoading(false);
  }
};

// export const googleLogin = async (googleToken: string)=>{
//   const { setLoading, setError } = useAuthStore.getState();
//   setLoading(true);
//   setError(null);
//   try{
//     const response = await axios.post('google/',{ access_token: googleToken });
//     const {refresh ,access} = response.data;
//     useAuthStore.getState().setTokens(access,refresh);
//     return response.data;
//   } catch(error) {
//     const axiosError = error as AxiosError<{ error?: string }>;
//     const errorMessage = axiosError.response?.data?.error || 'Google login failed';
//     setError(errorMessage);
//     throw new Error(errorMessage);
//   } finally {
//     setLoading(false);
//   }
// };
