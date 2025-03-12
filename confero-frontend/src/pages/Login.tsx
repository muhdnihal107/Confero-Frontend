// import { useState } from "react";
// import { useAuthStore } from "../store";

const Login = () => {
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const { setTokens, setUser } = useAuthStore();
  return (
<div
      className="flex items-center justify-start min-h-screen px-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
    >
      <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-md ml-20">
        <h2 className="text-4xl font-regular text-center text-gray-800">Login</h2>
        <form className="mt-4 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button className="w-full bg-[#f06340] text-white p-3 rounded-md hover:bg-[#a12121]">
            <p>Sign In</p>
          </button>
        </form>
        <p>Don't have an Account? Register</p>

        <div>

        </div>
      </div>
    </div>
  )
}

export default Login