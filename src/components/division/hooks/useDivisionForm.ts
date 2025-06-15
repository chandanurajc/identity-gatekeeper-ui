
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DivisionFormData } from "@/types/division";
import { divisionSchema } from "../validation/divisionSchema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";
import { Organization } from "@/types/organization";

interface UseDivisionFormProps {
  initialData?: Partial<DivisionFormData>;
  onSubmit: (data: DivisionFormData) => Promise<void>;
  isEditing?: boolean;
}

export function useDivisionForm({ initialData, onSubmit, isEditing = false }: UseDivisionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch organizations for dropdown
  const { data: organizationsData = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.getOrganizations,
  });

  const organizations: Organization[] = Array.isArray(organizationsData) ? organizationsData : [];

  const form = useForm<DivisionFormData>({
    resolver: zodResolver(divisionSchema),
    defaultValues: {
      name: initialData?.name || "",
      organizationId: initialData?.organizationId || "",
      userDefinedCode: initialData?.userDefinedCode || "",
      type: initialData?.type || "Supplier",
      status: initialData?.status || "active",
      contacts: initialData?.contacts && initialData.contacts.length > 0 ? initialData.contacts : [],
      references: initialData?.references || [],
    },
  });

  const selectedOrgId = form.watch("organizationId");
  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  const handleSubmit = async (data: DivisionFormData) => {
    const latestContacts = form.getValues("contacts");
    if (!latestContacts || latestContacts.length === 0) {
      form.setError("contacts", {
        type: "manual",
        message: "At least one contact is required",
      });
      toast({
        title: "Validation Error",
        description: "Please add at least one contact.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, contacts: latestContacts });
    } catch (error) {
      // error handled by parent
      // do nothing here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactsChange = (contacts: any[]) => {
    form.setValue("contacts", contacts, { shouldValidate: true });
    if (contacts.length > 0) {
      form.clearErrors("contacts");
    }
    form.trigger("contacts");
  };

  const handleReferencesChange = (references: any[]) => {
    form.setValue("references", references, { shouldValidate: true });
  };

  return {
    form,
    organizations,
    selectedOrg,
    isSubmitting,
    isEditing,
    handleSubmit,
    handleContactsChange,
    handleReferencesChange,
    toast,
  };
}
