
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { partnerSupplierService } from "@/services/partnerSupplierService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { Organization } from "@/types/organization";

interface SupplierSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const SupplierSelect = ({ value, onChange, label = "Supplier", placeholder = "Select supplier", required = false }: SupplierSelectProps) => {
  const [suppliers, setSuppliers] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const { getCurrentOrganizationId } = useMultiTenant();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const currentOrganizationId = getCurrentOrganizationId();
      if (!currentOrganizationId) {
        console.error("No current organization ID found");
        setLoading(false);
        return;
      }

      const suppliersData = await partnerSupplierService.getPartnerSuppliers(currentOrganizationId);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading suppliers..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label} {required && "*"}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              {supplier.name} ({supplier.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SupplierSelect;
