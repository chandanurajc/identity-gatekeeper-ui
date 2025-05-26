
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
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();

  // Handle clicks outside sidebar to close it on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log('Click detected:', {
        isMobile,
        openMobile,
        target: event.target,
        targetElement: (event.target as Element)?.tagName,
        targetClasses: (event.target as Element)?.className
      });

      // Only handle on mobile when sidebar is open
      if (!isMobile || !openMobile) {
        console.log('Not handling click - not mobile or sidebar not open');
        return;
      }

      const target = event.target as Element;
      
      // Check if click is on sidebar trigger button or its children
      if (target?.closest('[data-sidebar="trigger"]') || 
          target?.closest('button[data-sidebar="trigger"]')) {
        console.log('Click on sidebar trigger, not closing');
        return;
      }

      // Check if click is inside the sidebar content or sheet
      if (target?.closest('[data-sidebar="sidebar"]') || 
          target?.closest('.sidebar') ||
          target?.closest('[data-mobile="true"]') ||
          target?.closest('.sheet-content')) {
        console.log('Click inside sidebar, not closing');
        return;
      }

      // Check if click is inside any modal, dropdown, or overlay
      if (target?.closest('[data-radix-popper-content-wrapper]') || 
          target?.closest('[role="dialog"]') || 
          target?.closest('[role="menu"]') ||
          target?.closest('[data-state="open"]')) {
        console.log('Click in modal/dropdown, not closing');
        return;
      }

      // If we get here, the click is outside the sidebar
      console.log('Click outside sidebar detected, closing sidebar');
      setOpenMobile(false);
    };

    if (isMobile) {
      console.log('Adding click listener for mobile sidebar');
      // Use capture phase to catch events before they bubble
      document.addEventListener('mousedown', handleClickOutside, true);
      
      return () => {
        console.log('Removing click listener for mobile sidebar');
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [openMobile, setOpenMobile, isMobile]);

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
