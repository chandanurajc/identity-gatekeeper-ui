
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SalesChannel, SalesChannelFormData } from "@/types/salesChannel";
import { salesChannelService } from "@/services/salesChannelService";
import { useSalesChannelPermissions } from "@/hooks/useSalesChannelPermissions";
import { useAuth } from "@/context/AuthContext";
import SalesChannelForm from "@/components/salesChannel/SalesChannelForm";
import { toast } from "sonner";

const SalesChannelEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canEditSalesChannel } = useSalesChannelPermissions();
  const [channel, setChannel] = useState<SalesChannel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canEditSalesChannel && id) {
      fetchSalesChannel();
    } else {
      setLoading(false);
    }
  }, [canEditSalesChannel, id]);

  const fetchSalesChannel = async () => {
    try {
      const channels = await salesChannelService.getSalesChannels();
      const foundChannel = channels.find(c => c.id === id);
      if (foundChannel) {
        setChannel(foundChannel);
      } else {
        toast.error("Sales channel not found");
        navigate("/master-data/sales-channels");
      }
    } catch (error) {
      console.error("Error fetching sales channel:", error);
      toast.error("Failed to fetch sales channel");
      navigate("/master-data/sales-channels");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: SalesChannelFormData) => {
    if (!user?.username || !id) {
      throw new Error("User not authenticated or channel ID missing");
    }

    await salesChannelService.updateSalesChannel(id, formData, user.username);
    navigate("/master-data/sales-channels");
  };

  const handleCancel = () => {
    navigate("/master-data/sales-channels");
  };

  if (!canEditSalesChannel) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to edit sales channels.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">Loading sales channel...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sales Channel Not Found</h2>
          <p>The requested sales channel could not be found.</p>
        </div>
      </div>
    );
  }

  const initialData: SalesChannelFormData = {
    name: channel.name,
    status: channel.status,
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Sales Channel</h1>
        <p className="text-muted-foreground">Update sales channel information</p>
      </div>

      <SalesChannelForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEdit={true}
      />
    </div>
  );
};

export default SalesChannelEdit;
