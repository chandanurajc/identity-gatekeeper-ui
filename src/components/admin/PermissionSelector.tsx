
import { useState, useEffect } from "react";
import { Permission } from "@/types/role";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleService } from "@/services/roleService";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PermissionSelectorProps {
  selectedPermissions: Permission[];
  onPermissionsChange: (permissions: Permission[]) => void;
}

const PermissionSelector = ({
  selectedPermissions,
  onPermissionsChange,
}: PermissionSelectorProps) => {
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedComponent, setSelectedComponent] = useState<string>("");
  const [filterText, setFilterText] = useState<string>("");

  useEffect(() => {
    const loadPermissionsAndFilters = async () => {
      const permissions = await roleService.getAllPermissions();
      setAllPermissions(permissions);
      
      // Filter out permissions that are already selected
      const available = permissions.filter(
        p => !selectedPermissions.some(sp => sp.id === p.id)
      );
      setAvailablePermissions(available);
      
      // Load unique modules and components for filtering
      const uniqueModules = await roleService.getUniqueModules();
      setModules(uniqueModules);
    };
    
    loadPermissionsAndFilters();
  }, [selectedPermissions]);

  useEffect(() => {
    const loadComponents = async () => {
      if (selectedModule) {
        const componentsByModule = await roleService.getComponentsByModule(selectedModule);
        setComponents(componentsByModule);
      } else {
        setComponents([]);
      }
      setSelectedComponent("");
    };
    
    loadComponents();
  }, [selectedModule]);

  useEffect(() => {
    const filterPermissions = async () => {
      let filtered: Permission[];
      
      if (selectedModule && selectedComponent) {
        filtered = await roleService.getPermissionsByModuleAndComponent(
          selectedModule,
          selectedComponent
        );
      } else if (selectedModule) {
        filtered = await roleService.getPermissionsByModule(selectedModule);
      } else if (selectedComponent) {
        filtered = await roleService.getPermissionsByComponent(selectedComponent);
      } else {
        filtered = await roleService.getAllPermissions();
      }
      
      // Apply text filter if present
      if (filterText) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(filterText.toLowerCase())
        );
      }
      
      // Filter out already selected permissions
      filtered = filtered.filter(
        p => !selectedPermissions.some(sp => sp.id === p.id)
      );
      
      setAvailablePermissions(filtered);
    };
    
    filterPermissions();
  }, [selectedModule, selectedComponent, filterText, selectedPermissions]);

  const handleAddPermission = (permission: Permission) => {
    const updatedSelected = [...selectedPermissions, permission];
    onPermissionsChange(updatedSelected);
  };

  const handleRemovePermission = (permission: Permission) => {
    const updatedSelected = selectedPermissions.filter(p => p.id !== permission.id);
    onPermissionsChange(updatedSelected);
  };

  const handleModuleChange = (value: string) => {
    setSelectedModule(value);
  };

  const handleComponentChange = (value: string) => {
    setSelectedComponent(value);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Available Permissions</h3>
        <div className="space-y-2 mb-4">
          <div className="flex gap-2">
            <Select onValueChange={handleModuleChange} value={selectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="Select Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Modules</SelectItem>
                {modules.map(module => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              onValueChange={handleComponentChange} 
              value={selectedComponent}
              disabled={!selectedModule}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Component" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Components</SelectItem>
                {components.map(component => (
                  <SelectItem key={component} value={component}>
                    {component}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Input
            placeholder="Filter permissions..."
            value={filterText}
            onChange={handleFilterChange}
          />
        </div>
        
        <Card className="h-80">
          <CardContent className="p-2">
            <ScrollArea className="h-full">
              <ul className="space-y-1">
                {availablePermissions.map(permission => (
                  <li 
                    key={permission.id} 
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
                  >
                    <div>
                      <div className="font-medium">{permission.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {permission.module} &gt; {permission.component}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleAddPermission(permission)}
                      title="Add permission"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {availablePermissions.length === 0 && (
                  <li className="p-4 text-center text-muted-foreground">
                    No available permissions match the filter criteria
                  </li>
                )}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Selected Permissions</h3>
        <Card className="h-[332px]">
          <CardContent className="p-2">
            <ScrollArea className="h-full">
              <ul className="space-y-1">
                {selectedPermissions.map(permission => (
                  <li 
                    key={permission.id} 
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
                  >
                    <div>
                      <div className="font-medium">{permission.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {permission.module} &gt; {permission.component}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemovePermission(permission)}
                      title="Remove permission"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {selectedPermissions.length === 0 && (
                  <li className="p-4 text-center text-muted-foreground">
                    No permissions selected yet
                  </li>
                )}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PermissionSelector;
