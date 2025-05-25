
import { SidebarFooter } from "@/components/ui/sidebar";

export function SidebarFooterContent() {
  return (
    <SidebarFooter className="border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
      <div className="px-2 py-2 text-xs text-sidebar-foreground/70">
        © 2024 App Portal
      </div>
    </SidebarFooter>
  );
}
