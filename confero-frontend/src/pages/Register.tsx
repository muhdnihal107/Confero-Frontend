import { useState, ChangeEvent, FormEvent } from "react";
import { useAuthStore } from "../Store/store";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "../api/auth";
import { Link } from "react-router-dom";

// Define form data type
interface FormData {
  username: string;
  email: string;
  age: string;
  phone_number: string;
  password: string;
  password2: string;
}

const Register: React.FC = () => {
  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    age: "",
    phone_number: "",
    password: "",
    password2: "",
  });

  const { isLoading, error } = useAuthStore(); // Ensure Zustand store correctly provides these values

 const registerMutation = useMutation<FormData, Error, FormData>({
  mutationFn: (formData) => registerUser(formData),
  onSuccess: (data) => {
    console.log("Register successful:", data);
  },
  onError: (error) => {
    console.error("Register failed:", error.message);
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
    <div
      className="flex items-center justify-center min-h-screen px-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
    >
      <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-2xl mx-auto">
        <h2 className="text-4xl font-regular text-center text-gray-800">Register</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              placeholder="Age"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <input
            type="tel"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            name="password2"
            value={form.password2}
            onChange={handleChange}
            placeholder="Confirm Password"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#e93a3a] text-white p-3 rounded-md hover:bg-[#a12121]"
          >
            {isLoading ? "Registering..." : "Sign up"}
          </button>
          {error && <p className="text-red-500 text-center">{String(error)}</p>}
        </form>
        <Link to={"/login"}>
          <p className="text-center text-blue-600 hover:underline mt-4">Already have an account? Login</p>
        </Link>
      </div>
    </div>
  );
};

export default Register;
