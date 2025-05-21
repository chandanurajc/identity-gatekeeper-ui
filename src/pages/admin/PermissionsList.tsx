
import { useEffect, useState } from "react";
import { Permission } from "@/types/role";
import { roleService } from "@/services/roleService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LockIcon, SearchIcon } from "lucide-react";

const PermissionsList = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const allPermissions = await roleService.getAllPermissions();
        setPermissions(allPermissions);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (permission.description && 
        permission.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LockIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">System Permissions</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Available Permissions</CardTitle>
          <div className="mt-4 relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Loading permissions...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Module</TableHead>
                    <TableHead className="w-[150px]">Component</TableHead>
                    <TableHead className="w-[200px]">Permission Name</TableHead>
                    <TableHead className="min-w-[300px]">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.length > 0 ? (
                    filteredPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>{permission.module}</TableCell>
                        <TableCell>{permission.component}</TableCell>
                        <TableCell>{permission.name.replace(/_/g, " ")}</TableCell>
                        <TableCell>{permission.description}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        No permissions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsList;
