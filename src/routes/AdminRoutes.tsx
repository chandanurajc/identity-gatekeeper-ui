
import React from 'react';
import { Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
import UsersList from "@/pages/admin/UsersList";
import CreateUser from "@/pages/admin/CreateUser";
import EditUser from "@/pages/admin/EditUser";
import UserDetails from "@/pages/admin/UserDetails";
import RolesList from "@/pages/admin/RolesList";
import RoleForm from "@/pages/admin/RoleForm";
import RoleDetails from "@/pages/admin/RoleDetails";
import OrganizationsList from "@/pages/admin/OrganizationsList";
import OrganizationCreate from "@/pages/admin/OrganizationCreate";
import OrganizationEdit from "@/pages/admin/OrganizationEdit";
import OrganizationDetail from "@/pages/admin/OrganizationDetail";
import DivisionsList from "@/pages/admin/DivisionsList";
import DivisionCreate from "@/pages/admin/DivisionCreate";
import DivisionEdit from "@/pages/admin/DivisionEdit";
import DivisionDetail from "@/pages/admin/DivisionDetail";
import PermissionsList from "@/pages/admin/PermissionsList";

export const AdminRoutes = () => (
  <>
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
  </>
);
