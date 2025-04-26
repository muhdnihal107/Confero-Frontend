// VerifyEmail.tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { verifyEmail } from "../../api/auth";

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const verifyMutation = useMutation({
    mutationFn: () => verifyEmail(uid, token),
    onSuccess: () => {
      alert("Email verified successfully! Please login.");
      navigate("/login");
    },
    onError: (error: Error) => {
      alert(`Verification failed: ${error.message}`);
      navigate("/login");
    },
  });

  useEffect(() => {
    if (uid && token) {
      verifyMutation.mutate();
    } else {
      navigate("/login");
    }
  }, [uid, token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-white">Verifying your email...</p>
    </div>
  );
};

export default VerifyEmail;