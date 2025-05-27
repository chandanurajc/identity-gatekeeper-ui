
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Partner } from "@/types/partner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePartnerPermissions } from "@/hooks/usePartnerPermissions";
import { partnerService } from "@/services/partnerService";
import PartnerList from "@/components/partner/PartnerList";
import AddPartner from "@/components/partner/AddPartner";
import { Plus } from "lucide-react";

const PartnersList = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const { toast } = useToast();
  const { canManagePartner } = usePartnerPermissions();
  const navigate = useNavigate();

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await partnerService.getPartners();
      setPartners(data);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load partners",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handlePartnerAdded = () => {
    fetchPartners();
    setActiveTab("list");
  };

  if (!canManagePartner) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground mt-2">
          You do not have permission to access partner management.
        </p>
        <p className="text-muted-foreground">
          Please contact your administrator if you believe you should have access to this resource.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading partners...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Partner Management</h2>
          <p className="text-muted-foreground">
            Manage partnerships with external organizations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Partners List</TabsTrigger>
          <TabsTrigger value="add">
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <PartnerList partners={partners} onRefresh={fetchPartners} />
        </TabsContent>
        
        <TabsContent value="add" className="space-y-4">
          <AddPartner onPartnerAdded={handlePartnerAdded} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartnersList;
