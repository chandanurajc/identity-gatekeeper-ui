
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CircleDollarSign } from "lucide-react";

const fetchTotalPayables = async (organizationId: string) => {
  const { data, error } = await supabase.rpc('get_total_payables', { p_organization_id: organizationId });

  if (error) throw new Error(error.message);
  return data;
};

export const TotalPayablesWidget = () => {
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();

  const { data: totalPayables, isLoading } = useQuery({
    queryKey: ["totalPayables", organizationId],
    queryFn: () => fetchTotalPayables(organizationId!),
    enabled: !!organizationId,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Payables to All Orgs</CardTitle>
        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <div className="text-2xl font-bold">
            ₹{Number(totalPayables).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Sum of all outstanding payables
        </CardDescription>
      </CardContent>
    </Card>
  );
};
