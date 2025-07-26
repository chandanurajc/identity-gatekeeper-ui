
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Boxes } from "lucide-react";

const fetchInventoryBalances = async (organizationId: string) => {
  // Get all inventory accounts for the org
  const { data: accounts, error: accError } = await supabase
    .from("chart_of_accounts")
    .select("account_code, account_name")
    .eq("organization_id", organizationId)
    .eq("account_type", "Assets - Inventory" as any);
  if (accError) throw new Error(accError.message);

  if (!accounts || accounts.length === 0) return [];

  // Get all journal lines for these accounts
  const accountCodes = accounts.map((a: any) => a.account_code);
  const { data: lines, error: jlError } = await supabase
    .from("journal_line")
    .select("account_code, debit_amount, credit_amount")
    .in("account_code", accountCodes);
  if (jlError) throw new Error(jlError.message);

  // Aggregate balances by account
  const balances: Record<string, { name: string; value: number }> = {};
  accounts.forEach((acc: any) => {
    balances[acc.account_code] = { name: acc.account_name, value: 0 };
  });
  (lines || []).forEach((line: any) => {
    if (!balances[line.account_code]) return;
    const debit = line.debit_amount || 0;
    const credit = line.credit_amount || 0;
    balances[line.account_code].value += debit - credit;
  });
  return Object.values(balances);
};

export function InventoryValueWidget() {
  const { hasPermission } = usePermissions();
  const organizationId = useOrganizationId();
  const canView = hasPermission("Inventory value");
  const { data, isLoading, error } = useQuery({
    queryKey: ["inventoryValueWidget", organizationId],
    queryFn: () => organizationId ? fetchInventoryBalances(organizationId) : [],
    enabled: !!organizationId && canView,
  });
  if (!canView) return null;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Inventory Value by Account</CardTitle>
        <Boxes className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : error ? (
          <div className="text-destructive">{error.message}</div>
        ) : data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((row) => (
              <div key={row.name} className="flex justify-between text-sm">
                <span>{row.name}</span>
                <span className="font-semibold">{row.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">No inventory accounts found.</div>
        )}
      </CardContent>
    </Card>
  );
}
