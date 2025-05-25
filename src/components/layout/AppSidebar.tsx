
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  Shield, 
  Lock, 
  Folder,
  Building,
  GitBranch,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useCategoryPermissions } from "@/hooks/useCategoryPermissions";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { useDivisionPermissions } from "@/hooks/useDivisionPermissions";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  permission: boolean;
}

interface ModuleGroup {
  name: string;
  items: MenuItem[];
}

export function AppSidebar() {
  const { canViewUsers } = usePermissions();
  const { canViewRoles, canViewPermissions } = useRolePermissions();
  const { canViewCategory } = useCategoryPermissions();
  const { canViewOrganization } = useOrganizationPermissions();
  const { canViewDivision } = useDivisionPermissions();
  const { setOpen } = useSidebar();
  
  // State for collapsible groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Main": true,
    "Administration": false,
    "Master Data": false,
    "System": false
  });
  
  // Group menu items by module
  const moduleGroups: ModuleGroup[] = [
    {
      name: "Main",
      items: [
        {
          path: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          permission: true
        }
      ]
    },
    {
      name: "Administration",
      items: [
        {
          path: "/admin/users",
          label: "User Management",
          icon: Users,
          permission: canViewUsers
        },
        {
          path: "/admin/roles",
          label: "Role Management",
          icon: Shield,
          permission: canViewRoles
        },
        {
          path: "/admin/permissions",
          label: "System Permissions",
          icon: Lock,
          permission: canViewPermissions
        },
        {
          path: "/admin/organizations",
          label: "Organizations",
          icon: Building,
          permission: canViewOrganization
        },
        {
          path: "/admin/divisions",
          label: "Divisions",
          icon: GitBranch,
          permission: canViewDivision
        }
      ]
    },
    {
      name: "Master Data",
      items: [
        {
          path: "/master-data/item-category",
          label: "Item Category",
          icon: Folder,
          permission: canViewCategory
        }
      ]
    },
    {
      name: "System",
      items: [
        {
          path: "/settings",
          label: "Settings",
          icon: Settings,
          permission: true
        }
      ]
    }
  ];

  // Filter groups where at least one item has permission
  const filteredGroups = moduleGroups.filter(
    group => group.items.some(item => item.permission)
  );

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleMenuItemClick = () => {
    // Close sidebar on mobile when menu item is clicked
    setOpen(false);
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">App Portal</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {filteredGroups.map((group) => {
          const accessibleItems = group.items.filter(item => item.permission);
          if (accessibleItems.length === 0) return null;

          return (
            <Collapsible
              key={group.name}
              open={openGroups[group.name]}
              onOpenChange={() => toggleGroup(group.name)}
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden cursor-pointer hover:bg-sidebar-accent rounded-md flex items-center justify-between">
                    <span>{group.name}</span>
                    <div className="group-data-[collapsible=icon]:hidden">
                      {openGroups[group.name] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {accessibleItems.map((item) => (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton 
                            asChild 
                            tooltip={item.label}
                          >
                            <NavLink 
                              to={item.path} 
                              onClick={handleMenuItemClick}
                              className={({ isActive }) => cn(
                                "flex items-center gap-3",
                                isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
        <div className="px-2 py-2 text-xs text-sidebar-foreground/70">
          © 2024 App Portal
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
