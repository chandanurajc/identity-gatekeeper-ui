
import { useAuth } from "@/context/AuthContext";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { GlobalSearch } from "./GlobalSearch";

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 bg-black text-white px-4 lg:px-6 w-full border-b border-gray-700">
      {/* Left spacer */}
      <div className="flex-1"></div>

      {/* Center - Global Search */}
      <div className="flex-1 flex justify-center max-w-md mx-auto">
        <GlobalSearch />
      </div>

      {/* Right side - Organization and User Menu */}
      <div className="flex-1 flex justify-end items-center gap-4">
        {/* Organization context display */}
        {user && (
          <div className="text-sm text-gray-300 hidden lg:block">
            {user.organizationCode} - {user.organizationName}
          </div>
        )}

        {/* User Menu */}
        <HeaderUserMenu />
      </div>
    </header>
  );
}
