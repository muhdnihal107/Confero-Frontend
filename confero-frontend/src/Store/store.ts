import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    error: string | null;
    user:{
        email: string;
        age: number|null;
        phone_number: string|null;
    } |null;
    setTokens: (access: string, refresh:string)=> void;
    setUser: (user: { email: string; age: number | null; phone_number: string | null})=>void;
    clearAuth: ()=>void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken:null,
            refreshToken:null,
            isLoading:false,
            error:null,
            user:null,
            setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
            setUser: (user) => set({ user }),
            clearAuth: () => set({ accessToken: null, refreshToken: null, user: null }),
            setLoading: (isLoading)=> set({isLoading}),
            setError: (error)=> set({error}),
        }),
        {name: "auth-store"}  // Key for localStorage
    )
);