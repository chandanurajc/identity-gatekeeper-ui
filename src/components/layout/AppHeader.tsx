
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { Search, Building } from "lucide-react";
import { Link } from "react-router-dom";

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 bg-black text-white px-4 lg:px-6 w-full border-b border-gray-700">
      {/* App Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-white no-underline">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
          <Building className="h-4 w-4" />
        </div>
        <div className="hidden md:block">
          App Portal
        </div>
      </Link>
      
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            className="pl-8 bg-gray-800 border-gray-600 text-white placeholder-gray-400" 
            placeholder="Search..." 
          />
        </div>
      </div>

      {/* Spacer to push user menu to the right */}
      <div className="flex-1"></div>

      {/* Organization context display */}
      {user && (
        <div className="text-sm text-gray-300 hidden lg:block">
          {user.organizationCode} - {user.organizationName}
        </div>
      )}

      {/* User Menu - Right aligned */}
      <HeaderUserMenu />
    </header>
  );
}
