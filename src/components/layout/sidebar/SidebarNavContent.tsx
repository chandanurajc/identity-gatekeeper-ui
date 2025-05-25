
import { SidebarContent } from "@/components/ui/sidebar";
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
    <SidebarContent>
      {filteredGroups.map((group, index) => (
        <SidebarNavGroup 
          key={group.name} 
          group={group} 
          defaultOpen={index === 0} // First group open by default
          onItemClick={onItemClick}
        />
      ))}
    </SidebarContent>
  );
}
