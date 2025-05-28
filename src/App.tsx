
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
import PartnersList from "./pages/master-data/PartnersList";
import ItemGroupsList from "./pages/master-data/ItemGroupsList";
import SalesChannelsList from "./pages/master-data/SalesChannelsList";
import SalesChannelCreate from "./pages/master-data/SalesChannelCreate";
import SalesChannelEdit from "./pages/master-data/SalesChannelEdit";
import ItemsList from "./pages/master-data/ItemsList";
import ItemCreate from "./pages/master-data/ItemCreate";
import ItemEdit from "./pages/master-data/ItemEdit";
import ItemView from "./pages/master-data/ItemView";
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
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
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
            
            {/* Item Group Management Routes */}
            <Route 
              path="/master-data/item-groups" 
              element={
                <PermissionProtectedRoute requiredPermission="view-item-group">
                  <MainLayout>
                    <ItemGroupsList />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            
            {/* Sales Channel Management Routes */}
            <Route 
              path="/master-data/sales-channels" 
              element={
                <PermissionProtectedRoute requiredPermission="view-sales-channel">
                  <MainLayout>
                    <SalesChannelsList />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/master-data/sales-channels/create" 
              element={
                <PermissionProtectedRoute requiredPermission="create-sales-channel">
                  <MainLayout>
                    <SalesChannelCreate />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/master-data/sales-channels/edit/:id" 
              element={
                <PermissionProtectedRoute requiredPermission="edit-sales-channel">
                  <MainLayout>
                    <SalesChannelEdit />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            
            {/* Item Master Management Routes */}
            <Route 
              path="/master-data/items" 
              element={
                <PermissionProtectedRoute requiredPermission="view-item">
                  <MainLayout>
                    <ItemsList />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/master-data/items/create" 
              element={
                <PermissionProtectedRoute requiredPermission="create-item">
                  <MainLayout>
                    <ItemCreate />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/master-data/items/edit/:id" 
              element={
                <PermissionProtectedRoute requiredPermission="edit-item">
                  <MainLayout>
                    <ItemEdit />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            <Route 
              path="/master-data/items/view/:id" 
              element={
                <PermissionProtectedRoute requiredPermission="view-item">
                  <MainLayout>
                    <ItemView />
                  </MainLayout>
                </PermissionProtectedRoute>
              } 
            />
            
            {/* Partner Management Routes */}
            <Route 
              path="/master-data/partners" 
              element={
                <PermissionProtectedRoute requiredPermission="manage_partner">
                  <MainLayout>
                    <PartnersList />
                  </MainLayout>
                </PermissionProtectedRoute>
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
