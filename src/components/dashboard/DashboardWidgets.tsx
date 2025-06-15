
import { usePermissions } from "@/hooks/usePermissions";
import { OpenPurchaseOrdersWidget } from "./OpenPurchaseOrdersWidget";
import { TotalPayablesWidget } from "./TotalPayablesWidget";

export const DashboardWidgets = () => {
  const { hasPermission } = usePermissions();

  const canViewOpenPOWidget = hasPermission("View Open PO Widget");
  const canViewPayablesSummaryWidget = hasPermission("View Payables Summary Widget");

  const showWidgets = canViewOpenPOWidget || canViewPayablesSummaryWidget;

  if (!showWidgets) {
    return null;
  }

  return (
    <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Finance Snapshot</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {canViewOpenPOWidget && <OpenPurchaseOrdersWidget />}
            {canViewPayablesSummaryWidget && <TotalPayablesWidget />}
        </div>
    </div>
  );
};
