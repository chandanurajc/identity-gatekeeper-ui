
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { supplierService } from "@/services/supplierService";
import { SupplierForm } from "@/components/supplier/SupplierForm";
import { Supplier, SupplierFormData } from "@/types/supplier";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const SupplierEdit = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canEditSupplier } = usePermissions();
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        if (!supplierId) {
          throw new Error("Supplier ID is required");
        }

        const data = await supplierService.getSupplierById(supplierId);
        if (!data) {
          throw new Error("Supplier not found");
        }

        setSupplier(data);
      } catch (error) {
        console.error("Error fetching supplier:", error);
        toast({
          title: "Error",
          description: "Failed to load supplier details.",
          variant: "destructive",
        });
        navigate("/master-data/suppliers");
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId, navigate, toast]);

  const handleSave = async (formData: SupplierFormData) => {
    if (!canEditSupplier || !supplierId) {
      navigate("/unauthorized");
      return;
    }

    // Update supplier with current user as updater
    await supplierService.updateSupplier(
      supplierId, 
      formData, 
      user?.name || user?.email || "System"
    );
  };

  if (!canEditSupplier) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Unauthorized</h2>
        <p>You do not have permission to edit suppliers.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading supplier details...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Supplier Not Found</h2>
        <p>The requested supplier could not be found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Edit Supplier</h2>
      <p className="text-muted-foreground">Update the details for {supplier.name}.</p>

      <SupplierForm supplier={supplier} onSave={handleSave} isEditing={true} />
    </div>
  );
};

export default SupplierEdit;
