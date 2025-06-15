
import type { LucideIcon } from "lucide-react";

export interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: boolean;
}

export interface ModuleGroup {
  name: string;
  items: MenuItem[];
}
