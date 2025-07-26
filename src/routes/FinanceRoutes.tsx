
import React from 'react';
import { Routes, Route } from "react-router-dom";
import PermissionProtectedRoute from "@/components/PermissionProtectedRoute";
// GeneralLedgerViewer removed
import InvoicesList from "@/pages/finance/InvoicesList";
import InvoiceCreate from "@/pages/finance/InvoiceCreate";
import InvoiceDetail from "@/pages/finance/InvoiceDetail";
import InvoiceEdit from "@/pages/finance/InvoiceEdit";
import ChartOfAccountsList from "@/pages/finance/ChartOfAccountsList";
import ChartOfAccountsForm from "@/pages/finance/ChartOfAccountsForm";
import AccountingRulesList from "@/pages/finance/AccountingRulesList";
import AccountingRulesDetail from "@/pages/finance/AccountingRulesDetail";
import AccountingRulesForm from "@/pages/finance/AccountingRulesForm";
import JournalsList from "@/pages/finance/JournalsList";
import JournalForm from "@/pages/finance/JournalForm";
import JournalDetail from "@/pages/finance/JournalDetail";
import SubledgerList from "@/pages/finance/SubledgerList";
import PaymentsList from "@/pages/finance/PaymentsList";
import PaymentForm from "@/pages/finance/PaymentForm";
import PaymentDetail from "@/pages/finance/PaymentDetail";

export function FinanceRoutes() {
  return (
    <Routes>
      {/* GeneralLedgerViewer route removed */}
      <Route
        path="/chart-of-accounts"
        element={
          <PermissionProtectedRoute requiredPermission="View COA">
            <ChartOfAccountsList />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/chart-of-accounts/create"
        element={
          <PermissionProtectedRoute requiredPermission="Create COA">
            <ChartOfAccountsForm mode="create" />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/chart-of-accounts/:id/edit"
        element={
          <PermissionProtectedRoute requiredPermission="Edit COA">
            <ChartOfAccountsForm mode="edit" />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/accounting-rules"
        element={
          <PermissionProtectedRoute requiredPermission="View Rules">
            <AccountingRulesList />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/accounting-rules/create"
        element={
          <PermissionProtectedRoute requiredPermission="Create Rules">
            <AccountingRulesForm mode="create" />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/accounting-rules/:id/edit"
        element={
          <PermissionProtectedRoute requiredPermission="Edit Rules">
            <AccountingRulesForm mode="edit" />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/accounting-rules/:id"
        element={
          <PermissionProtectedRoute requiredPermission="View Rules">
            <AccountingRulesDetail />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/journals"
        element={
          <PermissionProtectedRoute requiredPermission="View Journal">
            <JournalsList />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/journals/create"
        element={
          <PermissionProtectedRoute requiredPermission="Create Journal">
            <JournalForm mode="create" />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/journals/:id/edit"
        element={
          <PermissionProtectedRoute requiredPermission="Edit Journal">
            <JournalForm mode="edit" />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/journals/:id"
        element={
          <PermissionProtectedRoute requiredPermission="View Journal">
            <JournalDetail />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/subledger"
        element={
          <PermissionProtectedRoute requiredPermission="View Subledger">
            <SubledgerList />
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
      <Route
        path="/payments"
        element={
          <PermissionProtectedRoute requiredPermission="View Payments">
            <PaymentsList />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/payments/create"
        element={
          <PermissionProtectedRoute requiredPermission="Create Payment">
            <PaymentForm />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/payments/:id"
        element={
          <PermissionProtectedRoute requiredPermission="View Payments">
            <PaymentDetail />
          </PermissionProtectedRoute>
        }
      />
      <Route
        path="/payments/:id/edit"
        element={
          <PermissionProtectedRoute requiredPermission="Edit Payment">
            <PaymentForm />
          </PermissionProtectedRoute>
        }
      />
    </Routes>
  );
}
