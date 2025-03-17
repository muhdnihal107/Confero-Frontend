import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginUser, registerUser, fetchProfile, updateProfile } from "../api/auth";

// Define User interface
interface User {
  email: string;
  username: string | null;
  age: number | null;
  Phone_number?: string | null;
  Profile_photo?: string | null;
}

// Define ProfileResponse interface to match backend response
interface ProfileResponse {
  email: string;
  username: string | null;
  age: number | null;
  Phone_number?: string | null;
  Profile_photo?: string | null; // Adjust to match backend field name (lowercase)
}

// Define TokenResponse to match backend response
interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

// Define Authentication State
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;

  isLoadingLogin: boolean;
  errorLogin: string | null;
  isLoadingRegistration: boolean;
  errorRegistration: string | null;
  isLoadingProfile: boolean;
  errorProfile: string | null;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    username: string;
    age?: number;
    phone_number?: string;
  }) => Promise<void>;
  fetchProfileData: () => Promise<void>;
  updateProfileData: (data: { phone_number?: string }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      isLoadingLogin: false,
      errorLogin: null,
      isLoadingRegistration: false,
      errorRegistration: null,
      isLoadingProfile: false,
      errorProfile: null,

      setTokens: (access, refresh) => {
        console.log("Setting tokens:", { access, refresh });
        set({ accessToken: access, refreshToken: refresh });
        console.log("Store state after setTokens:", get());
      },

      setUser: (user) => set({ user }),

      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          errorLogin: null,
          errorRegistration: null,
          errorProfile: null,
        }),

      login: async (email, password) => {
        set({ isLoadingLogin: true, errorLogin: null });
        try {
          const data: TokenResponse = await loginUser(email, password);
          console.log("Login response data:", data);
          set({
            accessToken: data.access_token, // Adjusted to match backend
            refreshToken: data.refresh_token,
            user: {
              email,
              username: null, // Username isn't available at login; fetchProfileData will populate it
              age: null,
              Phone_number: null,
              Profile_photo: null,
            },
            isLoadingLogin: false,
          });
          console.log("Store state after login:", get());
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Login failed";
          console.error("Login failed:", errorMessage);
          set({ errorLogin: errorMessage, isLoadingLogin: false });
          throw error; // Re-throw for React Query
        }
      },

      register: async (data) => {
        set({ isLoadingRegistration: true, errorRegistration: null });
        try {
          const response: TokenResponse = await registerUser(data);
          set({
            accessToken: response.access_token, // Adjusted to match backend
            refreshToken: response.refresh_token,
            user: {
              email: data.email,
              username: data.username, // Username is provided during registration
              age: data.age || null,
              Phone_number: data.phone_number || null,
              Profile_photo: null, // Profile photo isn't set during registration
            },
            isLoadingRegistration: false,
          });
          console.log("Store state after register:", get());
          await get().fetchProfileData();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Registration failed";
          console.error("Registration failed:", errorMessage);
          set({ errorRegistration: errorMessage, isLoadingRegistration: false });
          throw error; // Re-throw for React Query
        }
      },

      fetchProfileData: async () => {
        set({ isLoadingProfile: true, errorProfile: null });
        try {
          const profileData: ProfileResponse = await fetchProfile();
          set({
            user: {
              email: profileData.email || get().user?.email || "",
              username: profileData.username || null,
              age: profileData.age || null,
              Phone_number: profileData.Phone_number || null,
              Profile_photo: profileData.Profile_photo || null, // Adjusted to match backend field name
            },
            isLoadingProfile: false,
          });
          console.log("Store state after fetchProfileData:");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch profile";
          console.error("Failed to fetch profile:", errorMessage);
          set({ errorProfile: errorMessage, isLoadingProfile: false });
          throw error;
        }
      },

      updateProfileData: async (data: { Phone_number?: string,Profile_photo?: File }) => {
        set({ isLoadingProfile: true, errorProfile: null });
        try {
          const response: ProfileResponse = await updateProfile(data);
          set({
            user: {
              email: get().user?.email || "",
              username: response.username || get().user?.username || null,
              age: response.age || get().user?.age || null,
              Phone_number: response.Phone_number || null,
              Profile_photo: response.Profile_photo || get().user?.Profile_photo || null, // Adjusted to match backend field name
            },
            isLoadingProfile: false,
          });
          console.log("Store state after updateProfileData:", get());
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
          console.error("Failed to update profile:", errorMessage);
          set({ errorProfile: errorMessage, isLoadingProfile: false });
          throw error;
        }
      },

      logout: () => {
        console.log("Logging out - Clearing store state");
        get().clearAuth(); // Reset the state
        localStorage.removeItem("auth-store");
        console.log("Store state after logout:", get());
      },
    }),
    { name: "auth-store" }
  )
);