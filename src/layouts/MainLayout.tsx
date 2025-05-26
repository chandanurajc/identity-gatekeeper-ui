
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
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Element;
      
      if (
        isMobile &&
        open && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        !target?.closest('button[data-sidebar="trigger"]') &&
        !target?.closest('[data-sidebar="sidebar"]') &&
        !target?.closest('[data-sidebar="menu-button"]') &&
        !target?.closest('[data-sidebar="menu-item"]') &&
        !target?.closest('[data-sidebar="group-label"]') &&
        !target?.closest('[data-sidebar="content"]')
      ) {
        setOpen(false);
      }
    };

    if (isMobile && open) {
      // Use passive listeners for better performance
      document.addEventListener('mousedown', handleClickOutside, { passive: true });
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
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

        {/* Main Content with error boundary */}
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
    <SidebarProvider defaultOpen={true}>
      <MainLayoutInner>{children}</MainLayoutInner>
    </SidebarProvider>
  );
};
