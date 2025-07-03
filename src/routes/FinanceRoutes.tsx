
import React from 'react';
import { Routes, Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import GeneralLedgerViewer from "@/pages/finance/GeneralLedgerViewer";
import InvoicesList from "@/pages/finance/InvoicesList";
import InvoiceCreate from "@/pages/finance/InvoiceCreate";
import InvoiceDetail from "@/pages/finance/InvoiceDetail";
import InvoiceEdit from "@/pages/finance/InvoiceEdit";

export function FinanceRoutes() {
  return (
    <Routes>
      <Route
        path="/general-ledger"
        element={
          <PermissionProtectedRoute requiredPermission="View General Ledger">
            <GeneralLedgerViewer />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <PermissionProtectedRoute requiredPermission="View Invoices">
            <InvoicesList />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/invoices/create"
        element={
          <PermissionProtectedRoute requiredPermission="Create Invoice">
            <InvoiceCreate />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/invoices/:id"
        element={
          <PermissionProtectedRoute requiredPermission="View Invoices">
            <InvoiceDetail />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/invoices/:id/edit"
        element={
          <PermissionProtectedRoute requiredPermission="Edit Invoice">
            <InvoiceEdit />
          </PermissionProtectedRoute>
        }
      />
    </Routes>
  );
}
