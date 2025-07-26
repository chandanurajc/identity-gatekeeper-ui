
import { usePermissions } from "@/hooks/usePermissions";
import { OpenPurchaseOrdersWidget } from "./OpenPurchaseOrdersWidget";
// import { TotalPayablesWidget } from "./TotalPayablesWidget";

export const DashboardWidgets = () => {
  const { hasPermission } = usePermissions();

  const canViewOpenPOWidget = hasPermission("View Open PO Widget");
  // const canViewPayablesSummaryWidget = hasPermission("View Payables Summary Widget");

  const showWidgets = canViewOpenPOWidget; // removed payables widget

  if (!showWidgets) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {canViewOpenPOWidget && <OpenPurchaseOrdersWidget />}
        {/* Removed TotalPayablesWidget */}
      </div>
    </div>
  );
};
