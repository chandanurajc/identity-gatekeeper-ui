
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { supplierService } from "@/services/supplierService";
import { SupplierForm } from "@/components/supplier/SupplierForm";
import { SupplierFormData } from "@/types/supplier";
import { useAuth } from "@/context/AuthContext";

const SupplierCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateSupplier } = usePermissions();

  const handleSave = async (formData: SupplierFormData) => {
    if (!canCreateSupplier) {
      navigate("/unauthorized");
      return;
    }

    // Create supplier with current user as creator
    await supplierService.createSupplier(formData, user?.name || user?.email || "System");
  };

  if (!canCreateSupplier) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Unauthorized</h2>
        <p>You do not have permission to create suppliers.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Create Supplier</h2>
      <p className="text-muted-foreground">Fill in the details to create a new supplier.</p>

      <SupplierForm onSave={handleSave} />
    </div>
  );
};

export default SupplierCreate;
