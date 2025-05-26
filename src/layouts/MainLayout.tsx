
import { ReactNode, useRef, useEffect } from "react";
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
  const { open, setOpen, isMobile } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside sidebar to close it on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle on mobile when sidebar is open
      if (!isMobile || !open) return;

      const target = event.target as Element;
      
      // Check if click is on sidebar trigger button
      if (target?.closest('[data-sidebar="trigger"]')) {
        return; // Let the trigger handle it
      }

      // Check if click is inside the sidebar content
      if (target?.closest('[data-sidebar="sidebar"]')) {
        return; // Click is inside sidebar, don't close
      }

      // Check if click is inside any sidebar-related modal or dropdown
      if (target?.closest('[data-radix-popper-content-wrapper]') || 
          target?.closest('[role="dialog"]') || 
          target?.closest('[role="menu"]')) {
        return; // Click is in a modal/dropdown, don't close
      }

      // If we get here, the click is outside the sidebar
      console.log('Click outside sidebar detected, closing sidebar');
      setOpen(false);
    };

    if (isMobile && open) {
      // Add event listener to document
      document.addEventListener('mousedown', handleClickOutside, true);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [open, setOpen, isMobile]);

  return (
    <div className="flex min-h-screen w-full">
      <div ref={sidebarRef}>
        <AppSidebar />
      </div>
      
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
