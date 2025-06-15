
import { useState } from "react";
import { 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";
import { ModuleGroup } from "./types";

interface SidebarNavGroupProps {
  group: ModuleGroup;
  defaultOpen?: boolean;
  onItemClick: () => void;
}

export function SidebarNavGroup({ group, defaultOpen = true, onItemClick }: SidebarNavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { state } = useSidebar();
  
  // Filter items with permissions
  const accessibleItems = group.items.filter(item => item.permission);
  
  if (accessibleItems.length === 0) return null;

  // When collapsed, don't show group labels or collapsible behavior
  if (state === "collapsed") {
    return (
      <SidebarGroup className="px-0">
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
      </SidebarGroup>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SidebarGroup className="px-0">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden cursor-pointer hover:bg-sidebar-accent rounded-md flex items-center justify-between px-2 py-2">
            <span className="text-sm font-medium">{group.name}</span>
            <div className="group-data-[collapsible=icon]:hidden">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              )}
            </div>
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
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
