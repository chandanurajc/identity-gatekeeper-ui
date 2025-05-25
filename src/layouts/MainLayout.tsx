
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
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { NavLink } from "react-router-dom";
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  UserRound, 
  Shield, 
  Lock, 
  Folder,
  Search,
  LogOut,
  Building,
  GitBranch,
  Menu
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useCategoryPermissions } from "@/hooks/useCategoryPermissions";
import { useOrganizationPermissions } from "@/hooks/useOrganizationPermissions";
import { useDivisionPermissions } from "@/hooks/useDivisionPermissions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface MainLayoutProps {
  children: ReactNode;
}

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

// App Sidebar Component
function AppSidebar() {
  const { canViewUsers } = usePermissions();
  const { canViewRoles, canViewPermissions } = useRolePermissions();
  const { canViewCategory } = useCategoryPermissions();
  const { canViewOrganization } = useOrganizationPermissions();
  const { canViewDivision } = useDivisionPermissions();
  
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
            <SidebarGroup key={group.name}>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                {group.name}
              </SidebarGroupLabel>
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
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// User Menu Component
function UserMenu() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();

  if (state === "collapsed") {
    return (
      <SidebarMenuButton
        tooltip="Account"
        onClick={logout}
      >
        <UserRound className="h-4 w-4" />
        <span className="sr-only">Account</span>
      </SidebarMenuButton>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
        <UserRound className="h-4 w-4" />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{user?.name || user?.email}</span>
        <span className="truncate text-xs text-sidebar-foreground/70">
          {user?.organizationName}
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={logout}
        className="h-8 w-8"
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Logout</span>
      </Button>
    </div>
  );
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <SidebarInset className="flex flex-col flex-1">
          {/* Top Navigation Bar */}
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-8" 
                  placeholder="Search..." 
                />
              </div>
            </div>

            {/* Organization context display */}
            {user && (
              <div className="text-sm text-muted-foreground hidden md:block">
                {user.organizationCode} - {user.organizationName}
              </div>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
