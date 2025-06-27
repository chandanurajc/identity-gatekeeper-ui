
import React from 'react';
import { Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
import InvoicesList from "@/pages/invoice/InvoicesList";
import InvoiceDetail from "@/pages/invoice/InvoiceDetail";
import InvoiceCreate from "@/pages/invoice/InvoiceCreate";
import GeneralLedgerViewer from "@/pages/finance/GeneralLedgerViewer";

export const InvoiceRoutes = () => (
  <React.Fragment>
    <Route 
      path="/invoices" 
      element={
        <PermissionProtectedRoute requiredPermission="View Invoices">
          <MainLayout>
            <InvoicesList />
          </MainLayout>
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/invoices/create" 
      element={
        <PermissionProtectedRoute requiredPermission="Create Invoice">
          <MainLayout>
            <InvoiceCreate />
          </MainLayout>
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/invoices/:invoiceId" 
      element={
        <PermissionProtectedRoute requiredPermission="View Invoices">
          <MainLayout>
            <InvoiceDetail />
          </MainLayout>
        </PermissionProtectedRoute>
      } 
    />
    <Route 
      path="/finance/general-ledger" 
      element={
        <PermissionProtectedRoute requiredPermission="View General Ledger">
          <MainLayout>
            <GeneralLedgerViewer />
          </MainLayout>
        </PermissionProtectedRoute>
      } 
    />
  </React.Fragment>
);
