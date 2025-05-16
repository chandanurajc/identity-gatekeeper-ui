
import React from 'react';
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
import RolesList from "./pages/admin/RolesList";
import RoleForm from "./pages/admin/RoleForm";
import RoleDetails from "./pages/admin/RoleDetails";
import Settings from "./pages/Settings";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { MainLayout } from "./layouts/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Protected routes with MainLayout */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* User Management Routes */}
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <MainLayout>
                      <UsersList />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users/create" 
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <MainLayout>
                      <CreateUser />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users/edit/:userId" 
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <MainLayout>
                      <EditUser />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users/:userId" 
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <MainLayout>
                      <UserDetails />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Role Management Routes */}
              <Route 
                path="/admin/roles" 
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <MainLayout>
                      <RolesList />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/roles/create" 
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <MainLayout>
                      <RoleForm />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/roles/edit/:roleId" 
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <MainLayout>
                      <RoleForm />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/roles/:roleId" 
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <MainLayout>
                      <RoleDetails />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Settings Route */}
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
