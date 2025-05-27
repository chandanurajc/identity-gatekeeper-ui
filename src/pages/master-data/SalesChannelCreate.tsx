
import React from "react";
import { useNavigate } from "react-router-dom";
import { SalesChannelFormData } from "@/types/salesChannel";
import { salesChannelService } from "@/services/salesChannelService";
import { useSalesChannelPermissions } from "@/hooks/useSalesChannelPermissions";
import { useAuth } from "@/context/AuthContext";
import SalesChannelForm from "@/components/salesChannel/SalesChannelForm";

const SalesChannelCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateSalesChannel } = useSalesChannelPermissions();

  const handleSubmit = async (formData: SalesChannelFormData) => {
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    await salesChannelService.createSalesChannel(formData, user.email);
    navigate("/master-data/sales-channels");
  };

  const handleCancel = () => {
    navigate("/master-data/sales-channels");
  };

  if (!canCreateSalesChannel) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have permission to create sales channels.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Sales Channel</h1>
        <p className="text-muted-foreground">Add a new sales channel to the system</p>
      </div>

      <SalesChannelForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default SalesChannelCreate;
