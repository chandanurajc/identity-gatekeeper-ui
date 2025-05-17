
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
          <CardTitle className="text-xl">Select Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={currentModule} 
            onValueChange={setCurrentModule}
            className="w-full"
          >
            <TabsList className="bg-gray-100 p-1 mb-4">
              {modules.map(module => (
                <TabsTrigger 
                  key={module} 
                  value={module}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 py-2"
                >
                  {module}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {modules.map(module => (
              <TabsContent key={module} value={module} className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {getComponentsForModule(module).map(component => (
                    <div key={component} className="mb-8">
                      <h3 className="text-lg font-medium mb-3">{component}</h3>
                      <div className="space-y-3">
                        {allPermissions
                          .filter(p => p.module === module && p.component === component)
                          .map(permission => (
                            <div key={permission.id} className="flex items-center gap-3">
                              <Checkbox 
                                id={`permission-${permission.id}`}
                                checked={isPermissionSelected(permission.id)}
                                onCheckedChange={(checked) => handlePermissionChange(checked, permission)}
                                className="h-5 w-5 border-2"
                              />
                              <Label 
                                htmlFor={`permission-${permission.id}`}
                                className="text-base font-normal cursor-pointer"
                              >
                                {permission.name.replace(/_/g, ' ')}
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
