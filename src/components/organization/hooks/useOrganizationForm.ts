
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationFormData } from "@/types/organization";
import { organizationSchema } from "../validation/organizationSchema";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UseOrganizationFormProps {
  initialData?: Partial<OrganizationFormData>;
  onSubmit: (data: OrganizationFormData) => void;
  isEditing?: boolean;
}

export const useOrganizationForm = ({ initialData, onSubmit, isEditing = false }: UseOrganizationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    mode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      alias: initialData?.alias || "",
      type: initialData?.type || undefined,
      status: initialData?.status || "active",
      contacts: initialData?.contacts || [],
      references: initialData?.references || [],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        code: initialData.code || "",
        alias: initialData.alias || "",
        type: initialData.type || undefined,
        status: initialData.status || "active",
        contacts: initialData.contacts || [],
        references: initialData.references || [],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialData)]);

  const handleValidSubmit = async (data: OrganizationFormData) => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    
    try {
      if (!user?.id) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save organizations.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      await onSubmit(data);
      
      toast({
        title: "Success",
        description: `Organization ${isEditing ? "updated" : "created"} successfully`,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Save Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalidSubmit = (errors: any) => {
    const messages: string[] = [];
    
    Object.entries(errors).forEach(([field, error]: [string, any]) => {
      if ((field === 'contacts' || field === 'references') && Array.isArray(error)) {
        error.forEach((itemError, index) => {
          if (itemError) {
            Object.entries(itemError).forEach(([itemField, itemFieldError]: [string, any]) => {
              if (itemFieldError?.message) {
                const prefix = field === 'contacts' ? 'Contact' : 'Reference';
                messages.push(`${prefix} ${index + 1}, ${itemField}: ${itemFieldError.message}`);
              }
            });
          }
        });
      } else if (error?.message) {
        messages.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${error.message}`);
      }
    });
    
    if (messages.length === 0 && Object.keys(errors).length > 0) {
      messages.push("Some fields have invalid values. Please review the form.");
    }
    
    toast({
      title: "Validation Error",
      description: messages.join('; '),
      variant: "destructive",
    });
  };

  const handleContactsChange = (contacts: any[]) => {
    form.setValue("contacts", contacts, { shouldValidate: true, shouldDirty: true });
  };

  const handleReferencesChange = (references: any[]) => {
    form.setValue("references", references, { shouldValidate: true, shouldDirty: true });
  };

  return {
    form,
    isSubmitting,
    isEditing,
    handleSubmit: form.handleSubmit(handleValidSubmit, onInvalidSubmit),
    handleContactsChange,
    handleReferencesChange,
  };
};
