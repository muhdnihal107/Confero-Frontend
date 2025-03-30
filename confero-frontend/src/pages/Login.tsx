import { useState } from "react";
import { useAuthStore } from "../Store/authStore";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
// import axios from "axios";
// import { AxiosError } from "axios";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const { isLoadingLogin, errorLogin, login, requestPasswordReset, isLoadingReset, errorReset } = useAuthStore();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: () => {
      console.log("Login successful");
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
      useAuthStore.setState({ errorLogin: error.message });
    },
  });
  console.log(email)

  const forgotPasswordMutation = useMutation({
    mutationFn: () => requestPasswordReset(forgotEmail),
    onSuccess: () => {
      alert("Password reset link sent to your email!");
      setShowForgotPassword(false);
      setForgotEmail("");
    },
    onError: (error: Error) => {
      console.error("Forgot password failed:", error.message);
      useAuthStore.setState({ errorReset: error.message });
    },
  });

  // const googleLoginMutation = useMutation({
  //   mutationFn: (code: string) =>
  //     axios.post<{ access_token: string; refresh_token: string }>("http://localhost:8000/api/auth/google/", { code }),
  //   onSuccess: async (data) => {
  //     console.log("Google Login successful:", data.data);
  //     useAuthStore.getState().setTokens(data.data.access_token, data.data.refresh_token);
  //     await useAuthStore.getState().fetchProfileData();
  //     navigate("/");
  //   },
  //   onError: (error: AxiosError<{ error?: string }>) => {
  //     const errorMessage = error.response?.data?.error || "Google login failed";
  //     console.error("Google Login failed:", errorMessage);
  //     useAuthStore.setState({ errorLogin: errorMessage });
  //   },
  // });

  // 
  

  const clientId = '1092656538511-9g9vtc7715g4gsm088tjjiac7ksu9ita.apps.googleusercontent.com'; // Replace with your Google Client ID

const handleSuccess = async (credentialResponse: any) => {
  const { credential } = credentialResponse;
  console.log(credential, 'iii'); // Debugging: Log the credential
  try {
    // Send the Google credential to your backend for verification
    const res = await fetch('http://localhost:8000/api/auth/google/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential }),  // Send the JWT token
    });

    if (res.ok) {
      const data = await res.json();
      console.log('Google login successful:', data);
      // Save the user data to Zustand or local storage
    } else {
      console.error('Google login failed:', res.statusText);
    }
  } catch (error) {
    console.error('Error during Google login:', error);
  }
};

const handleFailure = () => {
  console.error('Google login failed');
};



  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    forgotPasswordMutation.mutate();
  };

  return (
    <div className="flex items-center justify-start min-h-screen px-6 bg-gray-900/80">
      <div className="bg-gray-800/90 backdrop-blur-md shadow-xl rounded-xl p-8 w-full max-w-md ml-20 border border-gray-700">
        {!showForgotPassword ? (
          <>
            <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
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
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                required
                disabled={isLoadingLogin}
              />
              <button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium disabled:opacity-50"
                type="submit"
                disabled={isLoadingLogin}
              >
                {isLoadingLogin ? "Signing In..." : "Sign In"}
              </button>
              {errorLogin && (
                <p className="text-red-400 text-center text-sm">Error: {errorLogin}</p>
              )}
            </form>
            <p className="text-center mt-4">
              <button
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>
            </p>
            <p className="text-center mt-4 text-gray-400">or</p>
            <Link to="/register">
              <p className="text-center text-indigo-400 hover:text-indigo-300 mt-4 transition-colors duration-200">
                Don’t have an Account? Register
              </p>
            </Link>
            {/* <button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-lg hover:from-blue-700 hover:to-blue-800 mt-4 transition-all duration-300 font-medium disabled:opacity-50"
              onClick={() => googleLogin()}
              disabled={isLoadingLogin}
            >
              {isLoadingLogin ? "Processing..." : "Login with Google"}
            </button> */}
            {/* Uncomment your GoogleLogin component if you still want to use it */}
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleFailure}
            />
          </>
        ) : (
          <>
            <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Reset Password
            </h2>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
              <input
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                disabled={isLoadingReset}
              />
              <button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium disabled:opacity-50"
                type="submit"
                disabled={isLoadingReset}
              >
                {isLoadingReset ? "Sending..." : "Send Reset Link"}
              </button>
              {errorReset && (
                <p className="text-red-400 text-center text-sm">Error: {errorReset}</p>
              )}
            </form>
            <p className="text-center mt-4">
              <button
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;