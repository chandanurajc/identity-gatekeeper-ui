import { useAuth } from "@/context/AuthContext";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
export function AppHeader() {
  const navigate = useNavigate();
  return <header className="flex h-14 items-center gap-4 bg-white text-black px-4 lg:px-6 w-full border-b border-gray-200">
      {/* Left side - Logo and Brand */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="flex items-center gap-2 p-2" onClick={() => navigate("/dashboard")}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-950">
            <span className="text-white font-bold text-sm">∞</span>
          </div>
          <span className="font-semibold text-lg">Nexuz</span>
        </Button>
      </div>

      {/* Center spacer */}
      <div className="flex-1"></div>

      {/* Right side - User Menu */}
      <div className="flex items-center">
        <HeaderUserMenu />
      </div>
    </header>;
}