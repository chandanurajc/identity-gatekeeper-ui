
import React from 'react';
import { Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
import PurchaseOrdersList from "@/pages/order-management/PurchaseOrdersList";
import PurchaseOrderCreate from "@/pages/order-management/PurchaseOrderCreate";
import PurchaseOrderEdit from "@/pages/order-management/PurchaseOrderEdit";
import PurchaseOrderDetail from "@/pages/order-management/PurchaseOrderDetail";
import PurchaseOrderReceiveList from "@/pages/order-management/PurchaseOrderReceiveList";
import PurchaseOrderReceiveEntry from "@/pages/order-management/PurchaseOrderReceiveEntry";

export const OrderManagementRoutes = () => (
    <React.Fragment>
        {/* Purchase Order Management Routes */}
        <Route 
            path="/order-management/purchase-orders" 
            element={
            <PermissionProtectedRoute requiredPermission="View PO">
                <MainLayout>
                <PurchaseOrdersList />
                </MainLayout>
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/order-management/purchase-orders/create" 
            element={
            <PermissionProtectedRoute requiredPermission="Create PO">
                <MainLayout>
                <PurchaseOrderCreate />
                </MainLayout>
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/order-management/purchase-orders/:id" 
            element={
            <PermissionProtectedRoute requiredPermission="View PO">
                <MainLayout>
                <PurchaseOrderDetail />
                </MainLayout>
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/order-management/purchase-orders/:id/edit" 
            element={
            <PermissionProtectedRoute requiredPermission="Edit PO">
                <MainLayout>
                <PurchaseOrderEdit />
                </MainLayout>
            </PermissionProtectedRoute>
            } 
        />

        <Route 
            path="/order-management/po-receive" 
            element={
            <PermissionProtectedRoute requiredPermission="View PO Receive">
                <MainLayout>
                <PurchaseOrderReceiveList />
                </MainLayout>
            </PermissionProtectedRoute>
            } 
        />

        <Route 
            path="/order-management/po-receive/:id" 
            element={
            <PermissionProtectedRoute requiredPermission="Create PO Receive">
                <MainLayout>
                <PurchaseOrderReceiveEntry />
                </MainLayout>
            </PermissionProtectedRoute>
            } 
        />
    </React.Fragment>
);
