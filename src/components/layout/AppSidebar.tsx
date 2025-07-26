
import { 
  Sidebar, 
  SidebarHeader,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/usePermissions";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { useDivisionPermissions } from "@/hooks/useDivisionPermissions";
import { usePartnerPermissions } from "@/hooks/usePartnerPermissions";
import { useSalesChannelPermissions } from "@/hooks/useSalesChannelPermissions";
import { useItemPermissions } from "@/hooks/useItemPermissions";
import { useItemGroupPermissions } from "@/hooks/useItemGroupPermissions";
import { usePurchaseOrderPermissions } from "@/hooks/usePurchaseOrderPermissions";
import { useInventoryPermissions } from "@/hooks/useInventoryPermissions";
import { useChartOfAccountsPermissions } from "@/hooks/useChartOfAccountsPermissions";
import { useAccountingRulesPermissions } from "@/hooks/useAccountingRulesPermissions";
import { useJournalPermissions } from "@/hooks/useJournalPermissions";
import { useSubledgerPermissions } from "@/hooks/useSubledgerPermissions";
import { usePaymentPermissions } from "@/hooks/usePaymentPermissions";
import { createModuleGroups } from "./sidebar/moduleGroups";
import { SidebarNavContent } from "./sidebar/SidebarNavContent";
import { SidebarFooterContent } from "./sidebar/SidebarFooterContent";

export function AppSidebar() {
  const { canViewUsers, hasPermission } = usePermissions();
  const { canViewRoles, canViewPermissions } = useRolePermissions();
  const { canViewOrganization } = useOrganizationPermissions();
  const { canViewDivision } = useDivisionPermissions();
  const { canManagePartner } = usePartnerPermissions();
  const { canViewSalesChannel } = useSalesChannelPermissions();
  const { canViewItem } = useItemPermissions();
  const { canViewItemGroup } = useItemGroupPermissions();
  const { canViewPurchaseOrders, canViewPOReceive } = usePurchaseOrderPermissions();
  const { canViewInventory, canViewInventoryTransfer } = useInventoryPermissions();
  const { canViewCOA } = useChartOfAccountsPermissions();
  const { canViewRules } = useAccountingRulesPermissions();
  const { canViewJournal } = useJournalPermissions();
  const { canViewSubledger } = useSubledgerPermissions();
  const { canViewPayments } = usePaymentPermissions();
  const { setOpen } = useSidebar();
  
  const permissions = {
    canViewUsers,
    canViewRoles,
    canViewPermissions,
    canViewOrganization,
    canViewDivision,
    canManagePartner,
    canViewSalesChannel,
    canViewItem,
    canViewItemGroup,
    canViewPurchaseOrders,
    canViewPOReceive,
    canViewInventory,
    canViewInventoryTransfer,
    // canViewGeneralLedger removed
    canViewInvoices: hasPermission("View Invoices"),
    canViewCOA,
    canViewRules,
    canViewJournal,
    canViewSubledger,
    canViewPayments,
  };

  const moduleGroups = createModuleGroups(permissions);

  const handleMenuItemClick = () => {
    setOpen(false);
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-14 border-b border-sidebar-border flex items-center">
        <div className="flex items-start justify-start px-2 py-2">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarNavContent 
        moduleGroups={moduleGroups} 
        onItemClick={handleMenuItemClick} 
      />
      
      <SidebarFooterContent />
    </Sidebar>
  );
}
