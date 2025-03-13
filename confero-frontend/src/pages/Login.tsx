import { useState } from "react";
import { useAuthStore } from "../Store/store";
import { loginUser } from "../api/auth";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
const Login: React.FC = () => {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const { isLoading, error } = useAuthStore(); // Ensure your Zustand store returns these correctly

   const navigate = useNavigate();

   const loginMutation = useMutation({
      mutationFn: () => loginUser(email, password),
      onSuccess: (data) => {
         console.log("Login successful:", data);
         navigate("/");
      },
      onError: (error: Error) => {
         console.error("Login failed", error.message);
      },
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
                  disabled={isLoading}
               />
               <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
               />

               <button
                  className="w-full bg-[#f06340] text-white p-3 rounded-md hover:bg-[#a12121]"
                  type="submit"
                  disabled={isLoading}
               >
                  <p>Sign In</p>
               </button>
               {error && <p style={{ color: "red" }}>Error: {error.toString()}</p>}
               {loginMutation.isSuccess && <p>Logged in successfully!</p>}
            </form>
            <Link to={'/register'}>    
                 <p className="text-center text-blue-600 hover:underline mt-4">Don't have an Account? Register</p>
            </Link>
         </div>
      </div>
   );
};

export default Login;
