
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, PackageOpen } from "lucide-react";

const fetchOpenPOCount = async (organizationId: string) => {
  const { count, error } = await supabase
    .from("purchase_order")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "Created");

  if (error) throw new Error(error.message);
  return count ?? 0;
};

export const OpenPurchaseOrdersWidget = () => {
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();

  const { data: count, isLoading } = useQuery({
    queryKey: ["openPOCount", organizationId],
    queryFn: () => fetchOpenPOCount(organizationId!),
    enabled: !!organizationId,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Open Purchase Orders</CardTitle>
        <PackageOpen className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <div className="text-2xl font-bold">{count}</div>
        )}
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Count of POs in 'Created' status
        </CardDescription>
      </CardContent>
    </Card>
  );
};
