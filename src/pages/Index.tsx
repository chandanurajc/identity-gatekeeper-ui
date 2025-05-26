
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/LoginForm";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Index page - Auth state:", { isAuthenticated, isLoading });
    
    // Only redirect if we're sure the user is authenticated and not loading
    if (isAuthenticated && !isLoading) {
      console.log("User is authenticated, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    console.log("User not authenticated, showing login form");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md">
          <LoginForm />
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Secure login with advanced role-based access control</p>
          </div>
        </div>
      </div>
    );
  }

  // This should not render due to the useEffect redirect above, but just in case
  return null;
};

export default Index;
