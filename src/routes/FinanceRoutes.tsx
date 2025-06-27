
import { Routes, Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import GeneralLedgerViewer from "@/pages/finance/GeneralLedgerViewer";
import InvoicesList from "@/pages/finance/InvoicesList";
import InvoiceCreate from "@/pages/finance/InvoiceCreate";

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
    </Routes>
  );
}
