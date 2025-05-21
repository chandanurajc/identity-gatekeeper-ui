
import { ReactNode } from "react";
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
  SidebarInset
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { NavLink } from "react-router-dom";
import { Users, LayoutList, Settings, UserRound, Shield, Lock, Folder } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useCategoryPermissions } from "@/hooks/useCategoryPermissions";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const { canViewUsers } = usePermissions();
  const { canViewRoles, canViewPermissions } = useRolePermissions();
  const { canViewCategory, canAccessInventory } = useCategoryPermissions();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="flex items-center px-4 py-2">
            <h1 className="text-xl font-bold">App Portal</h1>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Modules</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Dashboard is always visible for any logged in user */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Dashboard">
                      <NavLink to="/dashboard" className={({ isActive }) => isActive ? "font-bold" : ""}>
                        <LayoutList />
                        <span>Dashboard</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {canViewUsers && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="User Management">
                        <NavLink to="/admin/users" className={({ isActive }) => isActive ? "font-bold" : ""}>
                          <Users />
                          <span>User Management</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  
                  {canViewRoles && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Role Management">
                        <NavLink to="/admin/roles" className={({ isActive }) => isActive ? "font-bold" : ""}>
                          <Shield />
                          <span>Role Management</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  
                  {canViewPermissions && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="System Permissions">
                        <NavLink to="/admin/permissions" className={({ isActive }) => isActive ? "font-bold" : ""}>
                          <Lock />
                          <span>System Permissions</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {canAccessInventory && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Item Category">
                        <NavLink to="/master-data/item-category" className={({ isActive }) => isActive ? "font-bold" : ""}>
                          <Folder />
                          <span>Item Category</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  
                  {/* Settings is always visible for any logged in user */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Settings">
                      <NavLink to="/settings" className={({ isActive }) => isActive ? "font-bold" : ""}>
                        <Settings />
                        <span>Settings</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-4">
            {user && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm font-medium">{user.name || user.email}</div>
                </div>
                <div className="text-xs text-muted-foreground">Role: {user.roles.join(', ') || 'No roles assigned'}</div>
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
