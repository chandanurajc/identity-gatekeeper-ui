
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { getUsers } from "@/services/userService";
import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Plus, Edit, ArrowUp, ArrowDown } from "lucide-react";

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<string>("firstName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewUsers, canCreateUsers, canEditUsers } = usePermissions();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch users. Please try again later."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [toast]);

  const handleRowSelect = (userId: string) => {
    const newSelectedUsers = new Set(selectedUsers);
    
    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }
    
    setSelectedUsers(newSelectedUsers);
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = users.map(user => user.id);
      setSelectedUsers(new Set(allIds));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleCreateUser = () => {
    navigate("/admin/users/create");
  };

  const handleEditUser = () => {
    if (selectedUsers.size === 1) {
      const userId = Array.from(selectedUsers)[0];
      navigate(`/admin/users/edit/${userId}`);
    }
  };

  const handleViewUser = (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  const filteredUsers = users.filter(user => {
    return Object.entries(filters).every(([field, value]) => {
      if (!value) return true;
      
      const fieldValue = String(user[field as keyof User] || "").toLowerCase();
      return fieldValue.includes(value.toLowerCase());
    });
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const fieldA = String(a[sortField as keyof User] || "").toLowerCase();
    const fieldB = String(b[sortField as keyof User] || "").toLowerCase();
    
    if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (!canViewUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to view this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Users Management</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </div>
          <div className="flex space-x-2">
            {canCreateUsers && (
              <Button onClick={handleCreateUser}>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            )}
            {canEditUsers && (
              <Button 
                onClick={handleEditUser}
                disabled={selectedUsers.size !== 1}
                variant="outline"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <p>Loading users...</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 grid grid-cols-5 gap-4">
                <div>
                  <Input
                    placeholder="Filter by username"
                    onChange={(e) => handleFilterChange("username", e.target.value)}
                    value={filters.username || ""}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Filter by first name"
                    onChange={(e) => handleFilterChange("firstName", e.target.value)}
                    value={filters.firstName || ""}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Filter by last name"
                    onChange={(e) => handleFilterChange("lastName", e.target.value)}
                    value={filters.lastName || ""}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Filter by designation"
                    onChange={(e) => handleFilterChange("designation", e.target.value)}
                    value={filters.designation || ""}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Filter by organization"
                    onChange={(e) => handleFilterChange("organizationName", e.target.value)}
                    value={filters.organizationName || ""}
                  />
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedUsers.size === users.length && users.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("username")}>
                        <div className="flex items-center">
                          Username
                          {sortField === "username" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("firstName")}>
                        <div className="flex items-center">
                          First Name
                          {sortField === "firstName" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("lastName")}>
                        <div className="flex items-center">
                          Last Name
                          {sortField === "lastName" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("designation")}>
                        <div className="flex items-center">
                          Designation
                          {sortField === "designation" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("organizationName")}>
                        <div className="flex items-center">
                          Organization
                          {sortField === "organizationName" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("createdBy")}>
                        <div className="flex items-center">
                          Created By
                          {sortField === "createdBy" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("createdOn")}>
                        <div className="flex items-center">
                          Created On
                          {sortField === "createdOn" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("updatedBy")}>
                        <div className="flex items-center">
                          Updated By
                          {sortField === "updatedBy" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("updatedOn")}>
                        <div className="flex items-center">
                          Updated On
                          {sortField === "updatedOn" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.has(user.id)}
                              onCheckedChange={() => handleRowSelect(user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            {canViewUsers ? (
                              <button
                                onClick={() => handleViewUser(user.id)}
                                className="text-blue-600 hover:underline focus:outline-none"
                              >
                                {user.username}
                              </button>
                            ) : (
                              user.username
                            )}
                          </TableCell>
                          <TableCell>{user.firstName}</TableCell>
                          <TableCell>{user.lastName}</TableCell>
                          <TableCell>{user.designation || "N/A"}</TableCell>
                          <TableCell>{user.organizationName || "N/A"}</TableCell>
                          <TableCell>{user.createdBy}</TableCell>
                          <TableCell>{new Date(user.createdOn).toLocaleDateString()}</TableCell>
                          <TableCell>{user.updatedBy || "N/A"}</TableCell>
                          <TableCell>
                            {user.updatedOn 
                              ? new Date(user.updatedOn).toLocaleDateString() 
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersList;
