import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { useChartOfAccountsPermissions } from "@/hooks/useChartOfAccountsPermissions";
import { chartOfAccountsService } from "@/services/chartOfAccountsService";
import PermissionButton from "@/components/PermissionButton";

export default function ChartOfAccountsList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canViewCOA, canCreateCOA, canEditCOA } = useChartOfAccountsPermissions();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ['chart-of-accounts', organizationId],
    queryFn: () => organizationId ? chartOfAccountsService.getChartOfAccounts(organizationId) : Promise.resolve([]),
    enabled: !!organizationId && canViewCOA,
  });

  const handleDelete = async (id: string) => {
    if (!organizationId) return;
    
    setDeletingId(id);
    try {
      await chartOfAccountsService.deleteChartOfAccount(id, organizationId);
      toast({
        title: "Success",
        description: "Chart of account deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!canViewCOA) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view the Chart of Accounts.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-muted-foreground">Manage your organization's chart of accounts</p>
        </div>
        <Link to="/finance/chart-of-accounts/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No accounts found. Create your first account to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.accountCode}</TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{account.accountType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.status === 'Active' ? 'default' : 'secondary'}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{account.createdBy}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/finance/chart-of-accounts/${account.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(account.id)}
                          disabled={deletingId === account.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}