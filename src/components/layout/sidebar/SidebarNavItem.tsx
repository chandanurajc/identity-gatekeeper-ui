
import { NavLink } from "react-router-dom";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { MenuItem } from "./types";

interface SidebarNavItemProps {
  item: MenuItem;
  onItemClick: () => void;
}

export function SidebarNavItem({ item, onItemClick }: SidebarNavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.label}>
        <NavLink 
          to={item.path} 
          onClick={onItemClick}
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
  );
}
