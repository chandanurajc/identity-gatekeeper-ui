import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DivisionFormData } from "@/types/division";
import { divisionSchema } from "../validation/divisionSchema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";
import { Organization } from "@/types/organization";

// Newly add orgsLoading/orgsError for loading/error state
interface UseDivisionFormProps {
  initialData?: Partial<DivisionFormData>;
  onSubmit: (data: DivisionFormData) => Promise<void>;
  isEditing?: boolean;
}

export function useDivisionForm({ initialData, onSubmit, isEditing = false }: UseDivisionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch organizations for dropdown
  const {
    data: organizationsData = [],
    isLoading: orgsLoading,
    error: orgsQueryError
  } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.getOrganizations,
  });

  const organizations: Organization[] = Array.isArray(organizationsData) ? organizationsData : [];
  const orgsError = orgsQueryError ? (typeof orgsQueryError === "object" && "message" in orgsQueryError ? orgsQueryError.message : String(orgsQueryError)) : undefined;

  // Debug organization query
  if (orgsLoading) console.log("[useDivisionForm] Organizations loading...");
  if (orgsError) console.error("[useDivisionForm] Organizations query error:", orgsError);

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
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data });
    } catch (error) {
      // error handled by parent
      // do nothing here
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Fix: Always clear the error and re-validate when contacts are changed.
   */
  const handleContactsChange = (contacts: any[]) => {
    form.setValue("contacts", contacts, { shouldValidate: true });
    form.trigger("contacts");
  };

  const handleReferencesChange = (references: any[]) => {
    form.setValue("references", references, { shouldValidate: true });
    form.trigger("references");
  };

  return {
    form,
    organizations,
    selectedOrg,
    isSubmitting,
    isEditing,
    orgsLoading,
    orgsError,
    handleSubmit,
    handleContactsChange,
    handleReferencesChange,
    toast,
  };
}
