
import React from 'react';
import { Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
import InventoryVisibilityList from "@/pages/inventory/InventoryVisibilityList";
import InventoryStockLedger from "@/pages/inventory/InventoryStockLedger";

export const InventoryRoutes = () => (
    <React.Fragment>
        {/* Inventory Management Routes */}
        <Route 
            path="/inventory/visibility" 
            element={
            <PermissionProtectedRoute requiredPermission="view-inventory">
                <MainLayout>
                <InventoryVisibilityList />
                </MainLayout>
            </PermissionProtectedRoute>
            } 
        />
        <Route 
            path="/inventory/stock-ledger" 
            element={
            <PermissionProtectedRoute requiredPermission="view-inventory">
                <MainLayout>
                <InventoryStockLedger />
                </MainLayout>
            </PermissionProtectedRoute>
            } 
        />
    </React.Fragment>
);
