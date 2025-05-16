
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import UsersList from "./pages/admin/UsersList";
import CreateUser from "./pages/admin/CreateUser";
import EditUser from "./pages/admin/EditUser";
import UserDetails from "./pages/admin/UserDetails";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* User Management Routes */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <UsersList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/create" 
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <CreateUser />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/edit/:userId" 
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <EditUser />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/:userId" 
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <UserDetails />
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
