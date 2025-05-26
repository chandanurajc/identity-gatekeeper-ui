
import { ReactNode } from "react";
import { 
  SidebarProvider, 
  SidebarInset,
  useSidebar
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";

interface MainLayoutProps {
  children: ReactNode;
}

// Inner Layout Component that consumes sidebar context
function MainLayoutInner({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      
      <SidebarInset className="flex flex-col flex-1">
        {/* Fixed Header */}
        <div className="sticky top-0 z-50 bg-background border-b">
          <AppHeader />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}

// Main Layout wrapper that provides sidebar context
export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <MainLayoutInner>{children}</MainLayoutInner>
    </SidebarProvider>
  );
};
