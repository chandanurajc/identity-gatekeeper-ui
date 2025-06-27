
import React from 'react';
import { Routes, Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import PurchaseOrdersList from "@/pages/order-management/PurchaseOrdersList";
import PurchaseOrderCreate from "@/pages/order-management/PurchaseOrderCreate";
import PurchaseOrderEdit from "@/pages/order-management/PurchaseOrderEdit";
import PurchaseOrderDetail from "@/pages/order-management/PurchaseOrderDetail";
import PurchaseOrderReceiveList from "@/pages/order-management/PurchaseOrderReceiveList";
import PurchaseOrderReceiveEntry from "@/pages/order-management/PurchaseOrderReceiveEntry";

export const OrderManagementRoutes = () => (
    <Routes>
        {/* Purchase Order Management Routes */}
        <Route 
            path="/purchase-orders" 
            element={
            <PermissionProtectedRoute requiredPermission="View PO">
                <PurchaseOrdersList />
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/purchase-orders/create" 
            element={
            <PermissionProtectedRoute requiredPermission="Create PO">
                <PurchaseOrderCreate />
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/purchase-orders/:id" 
            element={
            <PermissionProtectedRoute requiredPermission="View PO">
                <PurchaseOrderDetail />
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/purchase-orders/:id/edit" 
            element={
            <PermissionProtectedRoute requiredPermission="Edit PO">
                <PurchaseOrderEdit />
            </PermissionProtectedRoute>
            } 
        />

        <Route 
            path="/po-receive" 
            element={
            <PermissionProtectedRoute requiredPermission="View PO Receive">
                <PurchaseOrderReceiveList />
            </PermissionProtectedRoute>
            } 
        />

        <Route 
            path="/po-receive/:id" 
            element={
            <PermissionProtectedRoute requiredPermission="Create PO Receive">
                <PurchaseOrderReceiveEntry />
            </PermissionProtectedRoute>
            } 
        />
    </Routes>
);
