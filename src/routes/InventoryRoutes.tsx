
import React from 'react';
import { Routes, Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import InventoryVisibilityList from "@/pages/inventory/InventoryVisibilityList";
import InventoryStockLedger from "@/pages/inventory/InventoryStockLedger";
import InventoryTransferList from "@/pages/inventory/InventoryTransferList";
import InventoryTransferCreate from "@/pages/inventory/InventoryTransferCreate";
import InventoryTransferDetail from "@/pages/inventory/InventoryTransferDetail";
import InventoryTransferEdit from "@/pages/inventory/InventoryTransferEdit";

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
    <Route 
      path="/transfer" 
      element={
        <PermissionProtectedRoute requiredPermission="View Inventory transfer">
          <InventoryTransferList />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/transfer/create" 
      element={
        <PermissionProtectedRoute requiredPermission="Create Inventory transfer">
          <InventoryTransferCreate />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/transfer/:id" 
      element={
        <PermissionProtectedRoute requiredPermission="View Inventory transfer">
          <InventoryTransferDetail />
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/transfer/:id/edit" 
      element={
        <PermissionProtectedRoute requiredPermission="Edit Inventory transfer">
          <InventoryTransferEdit />
        </PermissionProtectedRoute>
      } 
    />
  </Routes>
);
