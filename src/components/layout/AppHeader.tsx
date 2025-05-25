
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { Search, Building } from "lucide-react";

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* App Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building className="h-4 w-4" />
        </div>
        <div className="hidden md:block text-sm font-semibold">
          App Portal
        </div>
      </div>
      
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

      {/* Spacer to push user menu to the right */}
      <div className="flex-1"></div>

      {/* Organization context display */}
      {user && (
        <div className="text-sm text-muted-foreground hidden lg:block">
          {user.organizationCode} - {user.organizationName}
        </div>
      )}

      {/* User Menu - Right aligned */}
      <HeaderUserMenu />
    </header>
  );
}
