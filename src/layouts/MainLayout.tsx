
import { ReactNode, useState, useEffect } from "react";
import { 
  SidebarProvider, 
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
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { NavLink } from "react-router-dom";
import { 
  Users, 
  LayoutList, 
  Settings, 
  UserRound, 
  Shield, 
  Lock, 
  Folder,
  ChevronDown,
  ChevronUp,
  Menu
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useCategoryPermissions } from "@/hooks/useCategoryPermissions";
import { Button } from "@/components/ui/button";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

interface ModuleGroup {
  name: string;
  icon: React.ElementType;
  items: {
    path: string;
    label: string;
    icon: React.ElementType;
    permission: boolean;
  }[];
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const { canViewUsers } = usePermissions();
  const { canViewRoles, canViewPermissions } = useRolePermissions();
  const { canViewCategory, canAccessInventory } = useCategoryPermissions();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  
  // Group menu items by module
  const moduleGroups: ModuleGroup[] = [
    {
      name: "Dashboard",
      icon: LayoutList,
      items: [
        {
          path: "/dashboard",
          label: "Dashboard",
          icon: LayoutList,
          permission: true // Always accessible
        }
      ]
    },
    {
      name: "Admin",
      icon: Shield,
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
        }
      ]
    },
    {
      name: "Master Data",
      icon: Folder,
      items: [
        {
          path: "/master-data/item-category",
          label: "Item Category",
          icon: Folder,
          permission: canAccessInventory
        }
      ]
    },
    {
      name: "Settings",
      icon: Settings,
      items: [
        {
          path: "/settings",
          label: "Settings",
          icon: Settings,
          permission: true // Always accessible
        }
      ]
    }
  ];

  // Filter groups where at least one item has permission
  const filteredGroups = moduleGroups.filter(
    group => group.items.some(item => item.permission)
  );

  const handleGroupToggle = (groupName: string) => {
    setOpenGroup(openGroup === groupName ? null : groupName);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="flex items-center justify-between px-4 py-2">
            <h1 className="text-xl font-bold truncate">App Portal</h1>
            <SidebarTrigger className="ml-auto">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
          </SidebarHeader>
          
          <SidebarContent>
            {filteredGroups.map((group) => {
              // Only show groups with at least one accessible item
              const accessibleItems = group.items.filter(item => item.permission);
              if (accessibleItems.length === 0) return null;

              return (
                <SidebarGroup key={group.name}>
                  <SidebarGroupLabel
                    className="cursor-pointer"
                    onClick={() => handleGroupToggle(group.name)}
                  >
                    <group.icon className="mr-2 h-5 w-5" />
                    <span className="flex-1">{group.name}</span>
                    {openGroup === group.name ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <Collapsible 
                        open={openGroup === group.name} 
                        className="w-full"
                      >
                        <CollapsibleContent>
                          {accessibleItems.map((item) => (
                            <SidebarMenuItem key={item.path}>
                              <SidebarMenuButton 
                                asChild 
                                tooltip={item.label}
                              >
                                <NavLink 
                                  to={item.path} 
                                  className={({ isActive }) => isActive ? "font-bold" : ""}
                                >
                                  <item.icon className="h-5 w-5" />
                                  <span>{item.label}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>
          
          <SidebarFooter className="p-4">
            {user && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm font-medium truncate">{user.name || user.email}</div>
                </div>
                <div className="text-xs text-muted-foreground truncate">Role: {user.roles.join(', ') || 'No roles assigned'}</div>
                <Button variant="outline" size="sm" className="w-full" onClick={logout}>
                  Logout
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset>
          <div className="p-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
