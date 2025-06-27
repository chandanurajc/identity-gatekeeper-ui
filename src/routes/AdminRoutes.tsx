
import React from 'react';
import { Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
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
  <React.Fragment>
    {/* User Management Routes - Use permission-based protection */}
    <Route 
      path="/admin/users" 
      element={
        <PermissionProtectedRoute requiredPermission="view-user">
          <UsersList />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/users/create" 
      element={
        <PermissionProtectedRoute requiredPermission="create-user">
          <CreateUser />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/users/edit/:userId" 
      element={
        <PermissionProtectedRoute requiredPermission="edit-user">
          <EditUser />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/users/:userId" 
      element={
        <PermissionProtectedRoute requiredPermission="view-user">
          <UserDetails />
        </PermissionProtectedRoute>
      } 
    />
    
    {/* Role Management Routes - Use permission-based protection */}
    <Route 
      path="/admin/roles" 
      element={
        <PermissionProtectedRoute requiredPermission="view_roles">
          <RolesList />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/roles/create" 
      element={
        <PermissionProtectedRoute requiredPermission="create_role">
          <RoleForm />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/roles/edit/:roleId" 
      element={
        <PermissionProtectedRoute requiredPermission="edit_roles">
          <RoleForm />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/roles/:roleId" 
      element={
        <PermissionProtectedRoute requiredPermission="view_roles">
          <RoleDetails />
        </PermissionProtectedRoute>
      } 
    />
    
    {/* Organization Management Routes */}
    <Route 
      path="/admin/organizations" 
      element={
        <PermissionProtectedRoute requiredPermission="view-organization">
          <OrganizationsList />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/organizations/create" 
      element={
        <PermissionProtectedRoute requiredPermission="create-organization">
          <OrganizationCreate />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/organizations/edit/:organizationId" 
      element={
        <PermissionProtectedRoute requiredPermission="edit-organization">
          <OrganizationEdit />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/organizations/:organizationId" 
      element={
        <PermissionProtectedRoute requiredPermission="view-organization">
          <OrganizationDetail />
        </PermissionProtectedRoute>
      } 
    />
    
    {/* Division Management Routes */}
    <Route 
      path="/admin/divisions" 
      element={
        <PermissionProtectedRoute requiredPermission="view-division">
          <DivisionsList />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/divisions/create" 
      element={
        <PermissionProtectedRoute requiredPermission="create-division">
          <DivisionCreate />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/divisions/edit/:divisionId" 
      element={
        <PermissionProtectedRoute requiredPermission="edit-division">
          <DivisionEdit />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/admin/divisions/:divisionId" 
      element={
        <PermissionProtectedRoute requiredPermission="view-division">
          <DivisionDetail />
        </PermissionProtectedRoute>
      } 
    />
    
    {/* Permissions Management Route */}
    <Route 
      path="/admin/permissions" 
      element={
        <PermissionProtectedRoute requiredPermission="view_permissions">
          <PermissionsList />
        </PermissionProtectedRoute>
      } 
    />
  </React.Fragment>
);
