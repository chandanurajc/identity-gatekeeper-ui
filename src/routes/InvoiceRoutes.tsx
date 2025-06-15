
import React from 'react';
import { Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
import InvoicesList from "@/pages/invoice/InvoicesList";
import InvoiceDetail from "@/pages/invoice/InvoiceDetail";

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
      path="/invoices/:invoiceId" 
      element={
        <PermissionProtectedRoute requiredPermission="View Invoices">
          <MainLayout>
            <InvoiceDetail />
          </MainLayout>
        </PermissionProtectedRoute>
      } 
    />
  </React.Fragment>
);
