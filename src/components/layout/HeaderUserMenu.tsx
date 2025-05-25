
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { UserRound, LogOut } from "lucide-react";

export function HeaderUserMenu() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:block text-right">
        <div className="text-sm font-medium">{user?.name || user?.email}</div>
        <div className="text-xs text-muted-foreground">{user?.organizationName}</div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
        <UserRound className="h-4 w-4" />
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
