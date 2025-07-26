
import React from 'react';
import { Routes, Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import InventoryVisibilityList from "@/pages/inventory/InventoryVisibilityList";
import InventoryStockLedger from "@/pages/inventory/InventoryStockLedger";

export const InventoryRoutes = () => (
  <Routes>
    <Route 
      path="/visibility" 
      element={
        <PermissionProtectedRoute requiredPermission="View Inventory">
          <InventoryVisibilityList />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/stock-ledger" 
      element={
        <PermissionProtectedRoute requiredPermission="View Inventory">
          <InventoryStockLedger />
        </PermissionProtectedRoute>
      } 
    />
  </Routes>
);
