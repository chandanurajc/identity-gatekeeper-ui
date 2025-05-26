
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
import OrganizationsList from "./pages/admin/OrganizationsList";
import OrganizationCreate from "./pages/admin/OrganizationCreate";
import OrganizationEdit from "./pages/admin/OrganizationEdit";
import OrganizationDetail from "./pages/admin/OrganizationDetail";
import DivisionsList from "./pages/admin/DivisionsList";
import DivisionCreate from "./pages/admin/DivisionCreate";
import DivisionEdit from "./pages/admin/DivisionEdit";
import DivisionDetail from "./pages/admin/DivisionDetail";
import Settings from "./pages/Settings";
import PermissionsList from "./pages/admin/PermissionsList";
import CategoriesList from "./pages/inventory/CategoriesList";
import CategoryCreate from "./pages/inventory/CategoryCreate";
import CategoryDetail from "./pages/inventory/CategoryDetail";
import SuppliersList from "./pages/supplier/SuppliersList";
import SupplierCreate from "./pages/supplier/SupplierCreate";
import SupplierEdit from "./pages/supplier/SupplierEdit";
import SupplierDetail from "./pages/supplier/SupplierDetail";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionProtectedRoute from "./components/PermissionProtectedRoute";
import { MainLayout } from "./layouts/MainLayout";

const queryClient = new QueryClient();

const App = () => (
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
                <PermissionProtectedRoute requiredPermission="view_dashboard">
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            
            {/* User Management Routes - Use permission-based protection */}
            <Route 
              path="/admin/users" 
              element={
                <PermissionProtectedRoute requiredPermission="view-user">
                  <MainLayout>
                    <UsersList />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/create" 
              element={
                <PermissionProtectedRoute requiredPermission="create-user">
                  <MainLayout>
                    <CreateUser />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/edit/:userId" 
              element={
                <PermissionProtectedRoute requiredPermission="edit-user">
                  <MainLayout>
                    <EditUser />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/:userId" 
              element={
                <PermissionProtectedRoute requiredPermission="view-user">
                  <MainLayout>
                    <UserDetails />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            
            {/* Role Management Routes - Use permission-based protection */}
            <Route 
              path="/admin/roles" 
              element={
                <PermissionProtectedRoute requiredPermission="view_roles">
                  <MainLayout>
                    <RolesList />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/roles/create" 
              element={
                <PermissionProtectedRoute requiredPermission="create_role">
                  <MainLayout>
                    <RoleForm />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/roles/edit/:roleId" 
              element={
                <PermissionProtectedRoute requiredPermission="edit_roles">
                  <MainLayout>
                    <RoleForm />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/roles/:roleId" 
              element={
                <PermissionProtectedRoute requiredPermission="view_roles">
                  <MainLayout>
                    <RoleDetails />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            
            {/* Organization Management Routes */}
            <Route 
              path="/admin/organizations" 
              element={
                <PermissionProtectedRoute requiredPermission="view-organization">
                  <MainLayout>
                    <OrganizationsList />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/organizations/create" 
              element={
                <PermissionProtectedRoute requiredPermission="create-organization">
                  <MainLayout>
                    <OrganizationCreate />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/organizations/edit/:organizationId" 
              element={
                <PermissionProtectedRoute requiredPermission="edit-organization">
                  <MainLayout>
                    <OrganizationEdit />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/organizations/:organizationId" 
              element={
                <PermissionProtectedRoute requiredPermission="view-organization">
                  <MainLayout>
                    <OrganizationDetail />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            
            {/* Division Management Routes */}
            <Route 
              path="/admin/divisions" 
              element={
                <PermissionProtectedRoute requiredPermission="view-division">
                  <MainLayout>
                    <DivisionsList />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/divisions/create" 
              element={
                <PermissionProtectedRoute requiredPermission="create-division">
                  <MainLayout>
                    <DivisionCreate />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/divisions/edit/:divisionId" 
              element={
                <PermissionProtectedRoute requiredPermission="edit-division">
                  <MainLayout>
                    <DivisionEdit />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/admin/divisions/:divisionId" 
              element={
                <PermissionProtectedRoute requiredPermission="view-division">
                  <MainLayout>
                    <DivisionDetail />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            
            {/* Permissions Management Route */}
            <Route 
              path="/admin/permissions" 
              element={
                <PermissionProtectedRoute requiredPermission="view_permissions">
                  <MainLayout>
                    <PermissionsList />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />

            {/* Item Category Management Routes */}
            <Route 
              path="/master-data/item-category" 
              element={
                <PermissionProtectedRoute requiredPermission="view-category">
                  <MainLayout>
                    <CategoriesList />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/master-data/item-category/create" 
              element={
                <PermissionProtectedRoute requiredPermission="create-category">
                  <MainLayout>
                    <CategoryCreate />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/master-data/item-category/:categoryId" 
              element={
                <PermissionProtectedRoute requiredPermission="view-category">
                  <MainLayout>
                    <CategoryDetail />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            
            {/* Supplier Management Routes */}
            <Route 
              path="/master-data/suppliers" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SuppliersList />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/master-data/suppliers/create" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SupplierCreate />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/master-data/suppliers/edit/:supplierId" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SupplierEdit />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/master-data/suppliers/:supplierId" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SupplierDetail />
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
);

export default App;
