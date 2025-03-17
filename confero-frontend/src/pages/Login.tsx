import { useState } from "react";
import { useAuthStore } from "../Store/store";
//import { loginUser } from "../api/auth";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { AxiosError } from "axios";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isLoadingLogin, errorLogin, login } = useAuthStore();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: () => {
      console.log("Login successful");
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: (code: string) =>
      axios.post<{ access: string; refresh: string }>("http://localhost:8000/api/auth/google/", { code }),
    onSuccess: async (data) => {
      console.log("Google Login successful:", data.data);
      useAuthStore.getState().setTokens(data.data.access, data.data.refresh);
      await useAuthStore.getState().fetchProfileData();
      navigate("/");
    },
    onError: (error: AxiosError<{ error?: string }>) => {
      const errorMessage = error.response?.data?.error || "Google login failed";
      console.error("Google Login failed:", errorMessage);
      useAuthStore.setState({ errorLogin: errorMessage }); // Update store directly
    },
  });

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    scope: "email profile openid",
    onSuccess: (codeResponse) => {
      console.log("Google Code:", codeResponse.code);
      googleLoginMutation.mutate(codeResponse.code);
    },
    onError: (error) => console.error("Google Login Failed:", error),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div
      className="flex items-center justify-start min-h-screen px-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
    >
      <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-md ml-20">
        <h2 className="text-4xl font-regular text-center text-gray-800">Login</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoadingLogin}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isLoadingLogin}
          />
          <button
            className="w-full bg-[#f06340] text-white p-3 rounded-md hover:bg-[#a12121]"
            type="submit"
            disabled={isLoadingLogin}
          >
            <p>{isLoadingLogin ? "Signing In..." : "Sign In"}</p>
          </button>
          {errorLogin && <p style={{ color: "red" }}>Error: {errorLogin}</p>}
        </form>

        <p className="text-center mt-4">or</p>

        <Link to="/register">
          <p className="text-center text-blue-600 hover:underline mt-4">
            Don’t have an Account? Register
          </p>
        </Link>

        <button
          className="w-full bg-[#4285F4] text-white p-3 rounded-md hover:bg-[#357ABD] mt-4"
          onClick={() => googleLogin()}
          disabled={googleLoginMutation.isPending}
        >
          <p>{googleLoginMutation.isPending ? "Processing..." : "Login with Google"}</p>
        </button>
        {googleLoginMutation.isError && (
          <p style={{ color: "red" }}>
            Google Error: {googleLoginMutation.error.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;