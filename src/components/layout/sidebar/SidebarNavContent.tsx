
import { SidebarContent } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarNavGroup } from "./SidebarNavGroup";
import { ModuleGroup } from "./sidebarConfig";

interface SidebarNavContentProps {
  moduleGroups: ModuleGroup[];
  onItemClick: () => void;
}

export function SidebarNavContent({ moduleGroups, onItemClick }: SidebarNavContentProps) {
  // Filter groups where at least one item has permission
  const filteredGroups = moduleGroups.filter(
    group => group.items.some(item => item.permission)
  );

  return (
    <SidebarContent className="flex-1 overflow-hidden">
      <ScrollArea className="h-full w-full">
        <div className="space-y-2 p-2">
          {filteredGroups.map((group, index) => (
            <SidebarNavGroup 
              key={group.name} 
              group={group} 
              defaultOpen={true} // Expand all groups by default
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </ScrollArea>
    </SidebarContent>
  );
}
