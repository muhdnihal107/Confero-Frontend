import { useState, ChangeEvent, FormEvent } from "react";
import { useAuthStore } from "../../Store/authStore";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "../../api/auth";
import { Link, useNavigate } from "react-router-dom";

// Define form data type
interface FormData {
  username: string;
  email: string;
  password: string;
  password2: string;
}

const Register: React.FC = () => {
  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const { isLoadingRegistration, errorRegistration, setTokens, fetchProfileData } = useAuthStore();
  const navigate = useNavigate();
  const registerMutation = useMutation({
    mutationFn: (formData: FormData) => registerUser(formData),
    onSuccess: (data: { access_token: string; refresh_token: string }) => {
      console.log("Register successful:", data);
      setTokens(data.access_token, data.refresh_token); // Set tokens after registration
      fetchProfileData(); // Fetch profile to populate user data
      alert("Registration successful! Please verify your email.");
      navigate('/login')
    },
    onError: (error: Error) => {
      console.error("Register failed:", error.message);
      useAuthStore.setState({ errorRegistration: error.message });
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      alert("Passwords do not match!");
      return;
    }
    registerMutation.mutate(form);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 bg-gray-900/80">
      <div className="bg-gray-800/90 backdrop-blur-md shadow-xl rounded-xl p-8 w-full max-w-2xl mx-auto border border-gray-700">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Create Account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            required
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            required
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            required
          />
          <input
            type="password"
            name="password2"
            value={form.password2}
            onChange={handleChange}
            placeholder="Confirm Password"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            required
          />
          <button
            type="submit"
            disabled={isLoadingRegistration}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium disabled:opacity-50"
          >
            {isLoadingRegistration ? "Registering..." : "Sign Up"}
          </button>
          {errorRegistration && (
            <p className="text-red-400 text-center text-sm">{String(errorRegistration)}</p>
          )}
        </form>
        <Link to="/login">
          <p className="text-center text-indigo-400 hover:text-indigo-300 mt-6 transition-colors duration-200">
            Already have an account? Login
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Register;