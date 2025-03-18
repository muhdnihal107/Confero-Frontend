// ResetPassword.tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../Store/store";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const { isLoadingReset, errorReset, resetPassword } = useAuthStore();
  const navigate = useNavigate();

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const resetMutation = useMutation({
    mutationFn: () => resetPassword(password, uid, token),
    onSuccess: () => {
      alert("Password reset successfully! Please login with your new password.");
      navigate("/login");
    },
    onError: (error: Error) => {
      console.error("Reset password failed:", error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetMutation.mutate();
  };

  useEffect(() => {
    if (!uid || !token) {
      navigate("/login"); // Redirect if no uid/token
    }
  }, [uid, token, navigate]);

  return (
    <div
      className="flex items-center justify-start min-h-screen px-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
    >
      <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-md ml-20">
        <h2 className="text-4xl font-regular text-center text-gray-800">Reset Password</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoadingReset}
          />
          <button
            className="w-full bg-[#f06340] text-white p-3 rounded-md hover:bg-[#a12121]"
            type="submit"
            disabled={isLoadingReset}
          >
            <p>{isLoadingReset ? "Resetting..." : "Reset Password"}</p>
          </button>
          {errorReset && <p style={{ color: "red" }}>Error: {errorReset}</p>}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;