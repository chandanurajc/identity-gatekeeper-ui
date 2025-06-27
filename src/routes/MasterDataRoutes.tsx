
import React from 'react';
import { Routes, Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import ItemGroupsList from "@/pages/master-data/ItemGroupsList";
import SalesChannelsList from "@/pages/master-data/SalesChannelsList";
import SalesChannelCreate from "@/pages/master-data/SalesChannelCreate";
import SalesChannelEdit from "@/pages/master-data/SalesChannelEdit";
import ItemsList from "@/pages/master-data/ItemsList";
import ItemCreate from "@/pages/master-data/ItemCreate";
import ItemEdit from "@/pages/master-data/ItemEdit";
import ItemView from "@/pages/master-data/ItemView";
import PartnersList from "@/pages/master-data/PartnersList";

export const MasterDataRoutes = () => (
    <Routes>
        {/* Item Group Management Routes */}
        <Route 
            path="/item-groups" 
            element={
            <PermissionProtectedRoute requiredPermission="view-item-group">
                <ItemGroupsList />
            </PermissionProtectedRoute>
            } 
        />
        
        {/* Sales Channel Management Routes */}
        <Route 
            path="/sales-channels" 
            element={
            <PermissionProtectedRoute requiredPermission="view-sales-channel">
                <SalesChannelsList />
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/sales-channels/create" 
            element={
            <PermissionProtectedRoute requiredPermission="create-sales-channel">
                <SalesChannelCreate />
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/sales-channels/edit/:id" 
            element={
            <PermissionProtectedRoute requiredPermission="edit-sales-channel">
                <SalesChannelEdit />
            </PermissionProtectedRoute>
            } 
        />
        
        {/* Item Master Management Routes */}
        <Route 
            path="/items" 
            element={
            <PermissionProtectedRoute requiredPermission="view-item">
                <ItemsList />
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/items/create" 
            element={
            <PermissionProtectedRoute requiredPermission="create-item">
                <ItemCreate />
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/items/:itemId/edit" 
            element={
            <PermissionProtectedRoute requiredPermission="edit-item">
                <ItemEdit />
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/items/:itemId" 
            element={
            <PermissionProtectedRoute requiredPermission="view-item">
                <ItemView />
            </PermissionProtectedRoute>
            } 
        />
        
        {/* Partner Management Routes */}
        <Route 
            path="/partners" 
            element={
            <PermissionProtectedRoute requiredPermission="manage_partner">
                <PartnersList />
            </PermissionProtectedRoute>
            } 
        />
    </Routes>
);
