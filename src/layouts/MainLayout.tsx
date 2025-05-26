
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
  const { open, setOpen } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside sidebar to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        !(event.target as Element)?.closest('[data-sidebar="trigger"]')
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);

  return (
    <div className="flex min-h-screen w-full">
      <div ref={sidebarRef}>
        <AppSidebar />
      </div>
      
      <SidebarInset className="flex flex-col flex-1">
        {/* Fixed Header */}
        <div className="fixed top-0 right-0 left-0 z-50 bg-background border-b">
          <AppHeader />
        </div>

        {/* Main Content with top padding to account for fixed header */}
        <main className="flex-1 p-6 pt-20">
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
