
import { ReactNode, useState } from "react";
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
  Menu,
  Search,
  LogOut,
  Building
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useCategoryPermissions } from "@/hooks/useCategoryPermissions";
import { Button } from "@/components/ui/button";
import { 
  Collapsible, 
  CollapsibleContent
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
  const { canViewCategory, canAccessInventory, canViewSupplier } = useCategoryPermissions();
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
          permission: canViewCategory
        },
        {
          path: "/master-data/suppliers",
          label: "Suppliers",
          icon: Building,
          permission: canViewSupplier
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
      <div className="flex flex-col min-h-screen w-full">
        {/* Horizontal Navigation Bar - Made sticky */}
        <div className="flex items-center justify-between bg-primary text-primary-foreground h-14 px-4 shadow-md z-20 sticky top-0">
          <div className="flex items-center gap-4">
            {/* Hamburger menu on the left */}
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            {/* App name moved to the right of the hamburger */}
            <h1 className="text-xl font-bold">App Portal</h1>
            {/* Removed NavigationMenu component from here */}
          </div>

          {/* Search Bar */}
          <div className="flex-1 mx-8 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-primary-foreground/70" />
              <Input 
                className="bg-primary-foreground/20 border-primary-foreground/20 pl-8 text-primary-foreground placeholder:text-primary-foreground/70" 
                placeholder="Search anything..." 
              />
            </div>
          </div>

          {/* User Info and Logout */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                <span className="text-sm font-medium hidden md:inline">
                  {user.name || user.email}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout} 
                className="hover:bg-primary/90"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-1">
          {/* Vertical Sidebar - Made sticky */}
          <Sidebar variant="sidebar" collapsible="icon">
            {/* Empty header without SidebarTrigger */}
            <SidebarHeader className="sticky top-14 bg-sidebar z-10">
              {/* Removed SidebarTrigger from here */}
            </SidebarHeader>
            
            {/* Sidebar content */}
            <SidebarContent className="sticky top-24">
              {filteredGroups.map((group) => {
                // Only show groups with at least one accessible item
                const accessibleItems = group.items.filter(item => item.permission);
                if (accessibleItems.length === 0) return null;

                return (
                  <SidebarGroup key={group.name}>
                    <SidebarGroupLabel
                      className="cursor-pointer flex items-center"
                      onClick={() => handleGroupToggle(group.name)}
                    >
                      {/* Icon container with increased visibility */}
                      <div className="min-w-6 h-6 mr-2 flex items-center justify-center flex-shrink-0">
                        <group.icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <span className="flex-1 group-data-[collapsible=icon]:hidden">{group.name}</span>
                      {/* Display chevron in expanded sidebar view only */}
                      <span className="group-data-[collapsible=icon]:hidden">
                        {openGroup === group.name ? (
                          <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-2" />
                        )}
                      </span>
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
                                    className={({ isActive }) => cn(
                                      "flex items-center w-full",
                                      isActive ? "font-bold" : ""
                                    )}
                                  >
                                    {/* Enhanced icon container for improved visibility */}
                                    <div className="min-w-6 h-6 mr-2 flex items-center justify-center flex-shrink-0">
                                      <item.icon className="h-5 w-5" strokeWidth={2} />
                                    </div>
                                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
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
            
            {/* Empty footer */}
            <SidebarFooter className="px-4 py-2"></SidebarFooter>
          </Sidebar>
          
          <SidebarInset>
            <div className="p-6">
              {children}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};
