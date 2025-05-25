
import { useState } from "react";
import { 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";
import { ModuleGroup } from "./sidebarConfig";

interface SidebarNavGroupProps {
  group: ModuleGroup;
  defaultOpen?: boolean;
  onItemClick: () => void;
}

export function SidebarNavGroup({ group, defaultOpen = false, onItemClick }: SidebarNavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Filter items with permissions
  const accessibleItems = group.items.filter(item => item.permission);
  
  if (accessibleItems.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden cursor-pointer hover:bg-sidebar-accent rounded-md flex items-center justify-between">
            <span>{group.name}</span>
            <div className="group-data-[collapsible=icon]:hidden">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {accessibleItems.map((item) => (
                <SidebarNavItem 
                  key={item.path} 
                  item={item} 
                  onItemClick={onItemClick}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
