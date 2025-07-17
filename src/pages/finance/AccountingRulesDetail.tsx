import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { useAccountingRulesPermissions } from "@/hooks/useAccountingRulesPermissions";
import { accountingRulesService } from "@/services/accountingRulesService";
import { chartOfAccountsService } from "@/services/chartOfAccountsService";
import { divisionService } from "@/services/divisionService";
import PermissionButton from "@/components/PermissionButton";
import type { Division } from "@/types/division";
import type { ChartOfAccount } from "@/types/chartOfAccounts";

export default function AccountingRulesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canViewRules, canEditRules, canDeleteRules } = useAccountingRulesPermissions();
  const [isDeleting, setIsDeleting] = useState(false);

  // Load accounting rule details
  const { data: rule, isLoading, error } = useQuery({
    queryKey: ['accounting-rule', id],
    queryFn: () => id && organizationId ? accountingRulesService.getAccountingRuleById(id, organizationId) : null,
    enabled: !!id && !!organizationId && canViewRules,
  });

  // Load chart of accounts for displaying account names
  const { data: chartOfAccounts = [] } = useQuery<ChartOfAccount[]>({
    queryKey: ['chart-of-accounts', organizationId],
    queryFn: () => organizationId ? chartOfAccountsService.getChartOfAccounts(organizationId) : Promise.resolve([]),
    enabled: !!organizationId,
  });

  // Load divisions for displaying division name
  const { data: divisions = [] } = useQuery<Division[]>({
    queryKey: ["divisions", organizationId],
    queryFn: () => organizationId ? divisionService.getDivisions(organizationId) : Promise.resolve([]),
    enabled: !!organizationId,
  });

  const handleDelete = async () => {
    if (!id || !organizationId) return;
    
    setIsDeleting(true);
    try {
      await accountingRulesService.deleteAccountingRule(id, organizationId);
      toast({
        title: "Success",
        description: "Accounting rule deleted successfully",
      });
      navigate('/finance/accounting-rules');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete rule",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getAccountName = (accountCode: string | undefined) => {
    if (!accountCode) return "-";
    const account = chartOfAccounts.find(acc => acc.accountCode === accountCode);
    return account ? `${account.accountCode} - ${account.accountName}` : accountCode;
  };

  const getDivisionName = (divisionId: string | undefined) => {
    if (!divisionId) return "-";
    const division = divisions.find(div => div.id === divisionId);
    return division ? division.name : divisionId;
  };

  if (!canViewRules) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view accounting rules.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/finance/accounting-rules')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !rule) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/finance/accounting-rules')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load accounting rule details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/finance/accounting-rules')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{rule.ruleName}</h1>
            <p className="text-muted-foreground">Accounting Rule Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PermissionButton
            permission="Edit Rules"
            onClick={() => navigate(`/finance/accounting-rules/${id}/edit`)}
            size="sm"
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </PermissionButton>
          <PermissionButton
            permission="Delete Rules"
            onClick={handleDelete}
            size="sm"
            variant="destructive"
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </PermissionButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rule Name</label>
                <p className="text-sm font-medium mt-1">{rule.ruleName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Division</label>
                <p className="text-sm mt-1">{getDivisionName(rule.divisionId)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Category</label>
                <div className="mt-1">
                  <Badge variant="outline">{rule.transactionCategory}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Triggering Action</label>
                <p className="text-sm mt-1">{rule.triggeringAction}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Reference</label>
                <p className="text-sm mt-1 font-mono text-xs bg-muted px-2 py-1 rounded">
                  {rule.transactionReference}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Type</label>
                <p className="text-sm mt-1">{rule.transactionType || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Audit */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={rule.status === 'Active' ? 'default' : 'secondary'}>
                  {rule.status}
                </Badge>
              </div>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created By</label>
              <p className="text-sm mt-1">{rule.createdBy}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created On</label>
              <p className="text-sm mt-1">
                {new Date(rule.createdOn).toLocaleString()}
              </p>
            </div>
            {rule.updatedBy && (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated By</label>
                  <p className="text-sm mt-1">{rule.updatedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated On</label>
                  <p className="text-sm mt-1">
                    {rule.updatedOn ? new Date(rule.updatedOn).toLocaleString() : "-"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accounting Lines */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Accounting Lines</CardTitle>
          <CardDescription>Journal entry lines that will be created when this rule is triggered</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Line #</TableHead>
                  <TableHead>Debit Account</TableHead>
                  <TableHead>Credit Account</TableHead>
                  <TableHead>Amount Source</TableHead>
                  <TableHead className="w-32">Subledger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rule.lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{line.lineNumber}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {line.debitAccountCode ? (
                          <div className="text-sm">
                            <div className="font-medium">{line.debitAccountCode}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {chartOfAccounts.find(acc => acc.accountCode === line.debitAccountCode)?.accountName || ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {line.creditAccountCode ? (
                          <div className="text-sm">
                            <div className="font-medium">{line.creditAccountCode}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {chartOfAccounts.find(acc => acc.accountCode === line.creditAccountCode)?.accountName || ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {line.amountSource}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={line.enableSubledger ? 'default' : 'secondary'} className="text-xs">
                        {line.enableSubledger ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}