
import { usePermissions } from "@/hooks/usePermissions";
import { OpenPurchaseOrdersWidget } from "./OpenPurchaseOrdersWidget";
import { InvoicesPendingApprovalWidget } from "./InvoicesPendingApprovalWidget";
import { useOrganizationId } from "@/hooks/useOrganizationId";

import { AccountsPayableBalanceWidget } from "./AccountsPayableBalanceWidget";
import { InventoryValueWidget } from "./InventoryValueWidget";

export const DashboardWidgets = () => {
  const { hasPermission } = usePermissions();

  const canViewOpenPOWidget = hasPermission("View Open PO Widget");
  // const canViewPayablesSummaryWidget = hasPermission("View Payables Summary Widget");

  const organizationId = useOrganizationId();
  // Show if any widget is visible
  const showWidgets = (canViewOpenPOWidget || hasPermission("Invoice awaiting approval") || hasPermission("AP Balance") || hasPermission("Inventory value")) && !!organizationId;

  if (!showWidgets) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {canViewOpenPOWidget && <OpenPurchaseOrdersWidget />}
        {hasPermission("Invoice awaiting approval") && organizationId && (
          <InvoicesPendingApprovalWidget organizationId={organizationId} />
        )}
        {hasPermission("AP Balance") && organizationId && (
          <AccountsPayableBalanceWidget />
        )}
        {hasPermission("Inventory value") && organizationId && (
          <InventoryValueWidget />
        )}
      </div>
    </div>
  );
};
