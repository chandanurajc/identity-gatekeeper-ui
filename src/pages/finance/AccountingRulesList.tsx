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
import { useAccountingRulesPermissions } from "@/hooks/useAccountingRulesPermissions";
import { accountingRulesService } from "@/services/accountingRulesService";
import PermissionButton from "@/components/PermissionButton";

export default function AccountingRulesList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canViewRules, canCreateRules, canEditRules, canDeleteRules } = useAccountingRulesPermissions();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: rules = [], isLoading, refetch } = useQuery({
    queryKey: ['accounting-rules', organizationId],
    queryFn: () => organizationId ? accountingRulesService.getAccountingRules(organizationId) : Promise.resolve([]),
    enabled: !!organizationId && canViewRules,
  });

  const handleDelete = async (id: string) => {
    if (!organizationId) return;
    
    setDeletingId(id);
    try {
      await accountingRulesService.deleteAccountingRule(id, organizationId);
      toast({
        title: "Success",
        description: "Accounting rule deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete rule",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!canViewRules) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view accounting rules.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting Rules</h1>
          <p className="text-muted-foreground">Manage automated accounting rules</p>
        </div>
        <Link to="/finance/accounting-rules/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : rules.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No rules found. Create your first rule to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Source Type</TableHead>
                  <TableHead>Triggering Action</TableHead>
                  <TableHead>Debit Account</TableHead>
                  <TableHead>Credit Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.ruleName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.sourceType}</Badge>
                    </TableCell>
                    <TableCell>{rule.triggeringAction}</TableCell>
                    <TableCell>{rule.debitAccountCode}</TableCell>
                    <TableCell>{rule.creditAccountCode}</TableCell>
                    <TableCell>
                      <Badge variant={rule.status === 'Active' ? 'default' : 'secondary'}>
                        {rule.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/finance/accounting-rules/${rule.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <PermissionButton
                          permission="Delete Rules"
                          onClick={() => handleDelete(rule.id)}
                          size="sm"
                          variant="outline"
                          disabled={deletingId === rule.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </PermissionButton>
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