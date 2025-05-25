
import { 
  Sidebar, 
  SidebarHeader,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/usePermissions";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useCategoryPermissions } from "@/hooks/useCategoryPermissions";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { useDivisionPermissions } from "@/hooks/useDivisionPermissions";
import { createModuleGroups } from "./sidebar/sidebarConfig";
import { SidebarNavContent } from "./sidebar/SidebarNavContent";
import { SidebarFooterContent } from "./sidebar/SidebarFooterContent";

export function AppSidebar() {
  const { canViewUsers } = usePermissions();
  const { canViewRoles, canViewPermissions } = useRolePermissions();
  const { canViewCategory } = useCategoryPermissions();
  const { canViewOrganization } = useOrganizationPermissions();
  const { canViewDivision } = useDivisionPermissions();
  const { setOpen } = useSidebar();
  
  const permissions = {
    canViewUsers,
    canViewRoles,
    canViewPermissions,
    canViewCategory,
    canViewOrganization,
    canViewDivision
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
