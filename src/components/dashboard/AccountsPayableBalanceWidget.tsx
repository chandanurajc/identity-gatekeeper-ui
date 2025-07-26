import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import { supabase } from "@/integrations/supabase/client";

const fetchAPBalances = async (organizationId: string) => {
  const { data, error } = await supabase
    .from("subledger")
    .select("party_org_id, organizations!party_org_id(name), debit_amount, credit_amount, transaction_category")
    .eq("organization_id", organizationId)
    .in("transaction_category", ["Invoice", "Payment"]);

  if (error) throw new Error(error.message);

  // Aggregate by party_org_id
  const balances: Record<string, { name: string; balance: number }> = {};
  (data || []).forEach((row: any) => {
    const partyId = row.party_org_id;
    const name = row.organizations?.name || partyId;
    if (!balances[partyId]) {
      balances[partyId] = { name, balance: 0 };
    }
    const debit = row.debit_amount || 0;
    const credit = row.credit_amount || 0;
    balances[partyId].balance += credit - debit;
  });
  return Object.values(balances).filter(b => b.balance !== 0);
};

export function AccountsPayableBalanceWidget() {
  const { hasPermission } = usePermissions();
  const organizationId = useOrganizationId();
  const { data, isLoading, error } = useQuery({
    queryKey: ["apBalances", organizationId],
    queryFn: () => fetchAPBalances(organizationId!),
    enabled: !!organizationId && hasPermission("AP Balance"),
  });

  if (!hasPermission("AP Balance")) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Accounts Payable Balance</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : error ? (
          <div className="text-red-500 text-xs">{error.message || String(error)}</div>
        ) : data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((party) => (
              <div key={party.name} className="flex justify-between text-xs">
                <span>{party.name}</span>
                <span className="font-bold">{party.balance.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No outstanding payables</div>
        )}
      </CardContent>
    </Card>
  );
}
