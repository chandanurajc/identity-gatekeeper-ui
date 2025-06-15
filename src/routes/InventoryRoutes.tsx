
import React from 'react';
import { Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
import StockLedgerList from "@/pages/inventory/StockLedgerList";

export const InventoryRoutes = () => (
    <React.Fragment>
        {/* Inventory Management Routes */}
        <Route 
            path="/inventory/stock-ledger" 
            element={
            <PermissionProtectedRoute requiredPermission="view-inventory">
                <MainLayout>
                <StockLedgerList />
                </MainLayout>
            </PermissionProtectedRoute>
            } 
        />
    </React.Fragment>
);
