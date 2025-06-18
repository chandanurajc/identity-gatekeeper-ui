
import { useAuth } from "@/context/AuthContext";
import { HeaderUserMenu } from "./HeaderUserMenu";

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 bg-black text-white px-4 lg:px-6 w-full border-b border-gray-700">
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
