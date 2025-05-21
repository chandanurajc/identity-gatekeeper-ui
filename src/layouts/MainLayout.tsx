
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
  Menu,
  Search,
  LogOut
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
import { Input } from "@/components/ui/input";
import { 
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

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
      <div className="flex flex-col min-h-screen w-full">
        {/* Horizontal Navigation Bar */}
        <div className="flex items-center justify-between bg-primary text-primary-foreground h-14 px-4 shadow-md z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">App Portal</h1>
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                {filteredGroups.map((group) => (
                  <NavigationMenuItem key={group.name}>
                    <NavigationMenuLink
                      className="px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors rounded-md cursor-pointer"
                      asChild
                    >
                      <span>{group.name}</span>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
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
          {/* Vertical Sidebar */}
          <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="flex items-center justify-between px-4 py-2">
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
                                    className={({ isActive }) => cn(
                                      "flex items-center w-full",
                                      isActive ? "font-bold" : ""
                                    )}
                                  >
                                    <item.icon className="h-5 w-5 mr-2" />
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
