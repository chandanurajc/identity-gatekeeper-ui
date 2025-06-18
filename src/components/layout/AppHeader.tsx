
import { useAuth } from "@/context/AuthContext";
import { HeaderUserMenu } from "./HeaderUserMenu";

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 bg-white text-black px-4 lg:px-6 w-full border-b border-gray-200">
      {/* Left spacer */}
      <div className="flex-1"></div>

      {/* Center spacer */}
      <div className="flex-1 flex justify-center">
      </div>

      {/* Right side - Organization and User Menu */}
      <div className="flex-1 flex justify-end items-center gap-4">
        {/* Organization context display */}
        {user && (
          <div className="text-sm text-gray-700 hidden lg:block">
            {user.organizationName}
          </div>
        )}

        {/* User Menu */}
        <HeaderUserMenu />
      </div>
    </header>
  );
}
