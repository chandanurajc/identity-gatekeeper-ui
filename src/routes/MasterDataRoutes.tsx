
import React from 'react';
import { Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
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
    <React.Fragment>
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
    </React.Fragment>
);
