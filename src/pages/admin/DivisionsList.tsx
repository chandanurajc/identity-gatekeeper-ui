
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { divisionService } from "@/services/divisionService";
import { useDivisionPermissions } from "@/hooks/useDivisionPermissions";

const DivisionsList = () => {
  const { canViewDivision, canCreateDivision, canEditDivision } = useDivisionPermissions();

  const { data: divisions = [], isLoading, refetch } = useQuery({
    queryKey: ['divisions'],
    queryFn: divisionService.getAllDivisions,
  });

  if (isLoading) {
    return <div>Loading divisions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Division Management</h1>
          <p className="text-muted-foreground">Manage organizational divisions</p>
        </div>
        {canCreateDivision && (
          <Button asChild>
            <Link to="/admin/divisions/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Division
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Divisions</CardTitle>
          <CardDescription>
            A list of all divisions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Division Code</TableHead>
                <TableHead>Division Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Updated On</TableHead>
                {canEditDivision && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.map((division) => (
                <TableRow key={division.id}>
                  <TableCell>
                    {canViewDivision ? (
                      <Link 
                        to={`/admin/divisions/${division.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {division.code}
                      </Link>
                    ) : (
                      division.code
                    )}
                  </TableCell>
                  <TableCell>
                    {canViewDivision ? (
                      <Link 
                        to={`/admin/divisions/${division.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {division.name}
                      </Link>
                    ) : (
                      division.name
                    )}
                  </TableCell>
                  <TableCell>{division.organizationName}</TableCell>
                  <TableCell>{division.type}</TableCell>
                  <TableCell>
                    <Badge variant={division.status === 'active' ? 'default' : 'secondary'}>
                      {division.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{division.createdBy}</TableCell>
                  <TableCell>
                    {division.createdOn ? new Date(division.createdOn).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{division.updatedBy || '-'}</TableCell>
                  <TableCell>
                    {division.updatedOn ? new Date(division.updatedOn).toLocaleDateString() : '-'}
                  </TableCell>
                  {canEditDivision && (
                    <TableCell>
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/admin/divisions/edit/${division.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DivisionsList;
