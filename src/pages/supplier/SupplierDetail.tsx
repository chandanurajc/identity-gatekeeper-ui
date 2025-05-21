
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { supplierService } from "@/services/supplierService";
import { SupplierForm } from "@/components/supplier/SupplierForm";
import { Supplier } from "@/types/supplier";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

const SupplierDetail = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewSupplier, canEditSupplier } = usePermissions();
  
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

  if (!canViewSupplier) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Unauthorized</h2>
        <p>You do not have permission to view supplier details.</p>
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
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Supplier Details</h2>
        {canEditSupplier && (
          <Button 
            onClick={() => navigate(`/master-data/suppliers/edit/${supplier.id}`)}
          >
            <Pencil className="h-4 w-4 mr-2" /> Edit Supplier
          </Button>
        )}
      </div>
      <SupplierForm supplier={supplier} onSave={() => Promise.resolve()} readOnly={true} />
    </div>
  );
};

export default SupplierDetail;
