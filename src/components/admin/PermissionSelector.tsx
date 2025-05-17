
import React, { useState, useEffect } from "react";
import { roleService } from "@/services/roleService";
import { Permission } from "@/types/role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PermissionSelectorProps {
  selectedPermissions: Permission[];
  onPermissionsChange: (permissions: Permission[]) => void;
}

const PermissionSelector: React.FC<PermissionSelectorProps> = ({
  selectedPermissions,
  onPermissionsChange,
}) => {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentModule, setCurrentModule] = useState<string>("");

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const permissions = await roleService.getAllPermissions();
        const uniqueModules = await roleService.getUniqueModules();
        
        setAllPermissions(permissions);
        setModules(uniqueModules);
        
        if (uniqueModules.length > 0) {
          setCurrentModule(uniqueModules[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to load permissions:", error);
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const handlePermissionChange = (checked: boolean | "indeterminate", permission: Permission) => {
    if (checked === true) {
      // Add permission if not already selected
      if (!selectedPermissions.some(p => p.id === permission.id)) {
        onPermissionsChange([...selectedPermissions, permission]);
      }
    } else {
      // Remove permission
      onPermissionsChange(selectedPermissions.filter(p => p.id !== permission.id));
    }
  };

  const getComponentsForModule = (moduleName: string) => {
    const components = allPermissions
      .filter(p => p.module === moduleName)
      .reduce<string[]>((acc, perm) => {
        if (!acc.includes(perm.component)) {
          acc.push(perm.component);
        }
        return acc;
      }, []);
    
    return components;
  };

  const isPermissionSelected = (permissionId: string) => {
    return selectedPermissions.some(p => p.id === permissionId);
  };

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className="space-y-4">
      <Label className="text-base">Permissions*</Label>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={currentModule} 
            onValueChange={setCurrentModule}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full">
              {modules.map(module => (
                <TabsTrigger 
                  key={module} 
                  value={module}
                  className="text-xs md:text-sm"
                >
                  {module}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {modules.map(module => (
              <TabsContent key={module} value={module} className="mt-4">
                <ScrollArea className="h-[300px] pr-4">
                  {getComponentsForModule(module).map(component => (
                    <div key={component} className="mb-6">
                      <h4 className="font-medium mb-2">{component}</h4>
                      <div className="space-y-2">
                        {allPermissions
                          .filter(p => p.module === module && p.component === component)
                          .map(permission => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`permission-${permission.id}`}
                                checked={isPermissionSelected(permission.id)}
                                onCheckedChange={(checked) => handlePermissionChange(checked, permission)}
                              />
                              <Label 
                                htmlFor={`permission-${permission.id}`}
                                className="cursor-pointer"
                              >
                                {permission.name}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionSelector;
