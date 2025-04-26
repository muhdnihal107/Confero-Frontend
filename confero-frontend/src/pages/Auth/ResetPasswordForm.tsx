// // ResetPassword.tsx
// import { useState, useEffect } from "react";
// import { useAuthStore } from "../Store/store";
// import { useMutation } from "@tanstack/react-query";
// import { useNavigate, useSearchParams } from "react-router-dom";

// const ResetPassword: React.FC = () => {
//   const [new_password, setPassword] = useState("");
//   const [searchParams] = useSearchParams();
//   const { isLoadingReset, errorReset, resetPassword } = useAuthStore();
//   const navigate = useNavigate();

//   const token = searchParams.get("token") || "";

//   const resetMutation = useMutation({
//     mutationFn: () => resetPassword(token,new_password,),
//     onSuccess: () => {
//       alert("Password reset successfully! Please login with your new password.");
//       navigate("/login");
//     },
//     onError: (error: Error) => {
//       console.error("Reset password failed:", error.message);
//     },
//   });

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     resetMutation.mutate();
//   };

//   useEffect(() => {
//     if ( !token) {
//       navigate("/login"); // Redirect if no uid/token
//     }
//   }, [ token, navigate]);

//   return (
//     <div
//       className="flex items-center justify-start min-h-screen px-6 bg-cover bg-center"
//       style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
//     >
//       <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-md ml-20">
//         <h2 className="text-4xl font-regular text-center text-gray-800">Reset Password</h2>
//         <form onSubmit={handleSubmit} className="mt-4 space-y-4">
//           <input
//             className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             type="password"
//             placeholder="New Password"
//             value={new_password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             disabled={isLoadingReset}
//           />
//           <button
//             className="w-full bg-[#f06340] text-white p-3 rounded-md hover:bg-[#a12121]"
//             type="submit"
//             disabled={isLoadingReset}
//           >
//             <p>{isLoadingReset ? "Resetting..." : "Reset Password"}</p>
//           </button>
//           {errorReset && <p style={{ color: "red" }}>Error: {errorReset}</p>}
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ResetPassword;




// components/ResetPasswordForm.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../Store/authStore';

const ResetPasswordForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [new_password, setNewPassword] = useState('');
  const { resetPassword, isLoadingReset, errorReset } = useAuthStore();
console.log(token,'hhhhhh');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await resetPassword(token, new_password);
      alert('Password reset successfully.');
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  return (
    <>
    <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-md ml-20">
    <h2 className="text-4xl font-regular text-center text-gray-800">Reset Password</h2>
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label>New Password</label>
        <input
          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="password"
          value={new_password}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>
      {errorReset && <p style={{ color: 'red' }}>{errorReset}</p>}
      <button className="w-full bg-[#f06340] text-white p-3 rounded-md hover:bg-[#a12121]"
        type="submit" disabled={isLoadingReset}>
        {isLoadingReset ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
    </div>
    </>
  );
};

export default ResetPasswordForm;