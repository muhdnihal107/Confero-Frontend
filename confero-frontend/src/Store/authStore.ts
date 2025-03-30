import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginUser, registerUser, fetchProfile, updateProfile, requestPasswordReset, resetPassword, verifyEmail } from "../api/auth";

interface User {
  user_id: number | null;
  email: string;
  username: string | null;
  age: number | null;
  phone_number: string | null; 
  profile_photo: string | null; 
  is_verified?: boolean;
}

interface ProfileResponse {
  user_id: number;
  email: string;
  username: string | null;
  age: number | null;
  phone_number: string | null;
  profile_photo: string | null;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

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
  isLoadingReset: boolean;
  errorReset: string | null;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; username: string }) => Promise<void>;
  fetchProfileData: () => Promise<void>;
  updateProfileData: (data: { phone_number?: string; profile_photo?: File }) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (password: string, token: string) => Promise<void>;
  verifyEmail: (uid: string, token: string) => Promise<void>;
}
//--------------------------------------------------------------------------------------------------
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
      isLoadingReset: false,
      errorReset: null,

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
          errorReset: null,
        }),
//-----------------------------------------------------------------------------------------------
      login: async (email, password) => {
        set({ isLoadingLogin: false, errorLogin: null });
        try {
          const data: TokenResponse = await loginUser(email, password);
          console.log("Login response data:", data);
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: { user_id: null,email, username: null, age: null, phone_number: null, profile_photo: null },
            isLoadingLogin: false,
          });
          await get().fetchProfileData();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Login failed";
          console.error("Login failed:", errorMessage);
          set({ errorLogin: errorMessage, isLoadingLogin: false });
          throw error;
        }
      },
//------------------------------------------------------------------------------------------------
      register: async (data) => {
        set({ isLoadingRegistration: true, errorRegistration: null });
        try {
          const response: TokenResponse = await registerUser(data);
          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            user: {user_id:null, email: data.email, username: data.username, age: null, phone_number: null, profile_photo: null },
            isLoadingRegistration: false,
          });
          await get().fetchProfileData();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Registration failed";
          console.error("Registration failed:", errorMessage);
          set({ errorRegistration: errorMessage, isLoadingRegistration: false });
          throw error;
        }
      },
//----------------------------------------------------------------------------------------------
      fetchProfileData: async () => {
        set({ isLoadingProfile: true, errorProfile: null });
        try {
          const profileData = await fetchProfile();
          set({
            user: {
              user_id: profileData.user_id?? null,
              email: profileData.email || get().user?.email || "",
              username: profileData.username || null,
              age: profileData.age || null,
              phone_number: profileData.phone_number || null,
              profile_photo: profileData.profile_photo || null,
              is_verified: get().user?.is_verified || false, // Sync with CustomUser
            },
            isLoadingProfile: false,
          });
          console.log("Store state after fetchProfileData:", get());
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch profile";
          console.error("Failed to fetch profile:", errorMessage);
          set({ errorProfile: errorMessage, isLoadingProfile: false });
          throw error;
        }
      },
//-------------------------------------------------------------------------------------------------
      updateProfileData: async (data: { phone_number?: string; profile_photo?: File }) => {
        set({ isLoadingProfile: true, errorProfile: null });
        try {
          const response: ProfileResponse = await updateProfile(data);
          set({
            user: {
              user_id: null,
              email: get().user?.email || "",
              username: response.username || get().user?.username || null,
              age: response.age || get().user?.age || null,
              phone_number: response.phone_number || null,
              profile_photo: response.profile_photo || get().user?.profile_photo || null,
              is_verified: get().user?.is_verified || false,
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
//-------------------------------------------------------------------------------------------
      logout: () => {
        console.log("Logging out - Clearing store state");
        get().clearAuth();
        localStorage.removeItem("auth-store");
        console.log("Store state after logout:", get());
      },
//------------------------------------------------------------------------------------------------
      requestPasswordReset: async (email) => {
        set({ isLoadingReset: true, errorReset: null });
        try {
          await requestPasswordReset(email);
          set({ isLoadingReset: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to request password reset";
          set({ errorReset: errorMessage, isLoadingReset: false });
          throw error;
        }
      },
//----------------------------------------------------------------------------------------------------
      resetPassword: async (token,new_password) => {
        set({ isLoadingReset: true, errorReset: null });
        try {
          console.log({token,new_password});
          await resetPassword(token, new_password );
          set({ isLoadingReset: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to reset password";
          set({ errorReset: errorMessage, isLoadingReset: false });
          throw error;
        }
      },
//---------------------------------------------------------------------------------------------------
      verifyEmail: async (uid, token) => {
        set({ isLoadingReset: true, errorReset: null }); // Reuse reset loading state
        try {
          await verifyEmail(uid, token);
          const user = get().user;
          if (user) {
            set({ user: { ...user, is_verified: true }, isLoadingReset: false });
          }
          console.log("Email verified, updated store:", get());
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Email verification failed";
          set({ errorReset: errorMessage, isLoadingReset: false });
          throw error;
        }
      },
    }),
    { name: "auth-store" }
  )
);