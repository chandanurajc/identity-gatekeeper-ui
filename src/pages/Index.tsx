
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/LoginForm";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
          <p className="mt-2 text-gray-600">Sign in to access your account</p>
        </div>
        
        <LoginForm />
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Secure login with advanced role-based access control</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
