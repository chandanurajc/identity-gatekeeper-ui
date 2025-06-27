
import { Routes, Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
import GeneralLedgerViewer from "@/pages/finance/GeneralLedgerViewer";

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
    </Routes>
  );
}
