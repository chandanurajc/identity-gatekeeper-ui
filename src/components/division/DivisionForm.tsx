
import { Separator } from "@/components/ui/separator";
import { ContactForm } from "./ContactForm";
import { ReferenceForm } from "./ReferenceForm";
import { DivisionMainFields } from "./DivisionMainFields";
import { useDivisionForm } from "./hooks/useDivisionForm";
import { Form } from "@/components/ui/form";
import React from "react";

// Helper loader UI
function Loader() {
  return <div className="text-center py-8">Loading form data...</div>;
}

// Helper error UI
function ErrorMsg({message}:{message:string}) {
  return <div className="text-center py-8 text-destructive">{message}</div>;
}

interface DivisionFormProps {
  initialData?: Partial<import("@/types/division").DivisionFormData>;
  onSubmit: (data: import("@/types/division").DivisionFormData) => Promise<void>;
  isEditing?: boolean;
}

const DivisionForm = ({ initialData, onSubmit, isEditing = false }: DivisionFormProps) => {
  // Use the consolidated hook for form logic and validation
  const {
    form,
    organizations,
    selectedOrg,
    isSubmitting,
    handleSubmit,
    handleContactsChange,
    handleReferencesChange,
    isEditing: isEditingFromHook,
    toast,
    orgsLoading,
    orgsError,
  } = useDivisionForm({ initialData, onSubmit, isEditing });

  // Debug logs
  React.useEffect(() => {
    console.log("[DivisionForm] Props:", { initialData, onSubmit, isEditing });
    console.log("[DivisionForm] orgsLoading:", orgsLoading, "organizations:", organizations, "orgsError:", orgsError);
  }, [initialData, onSubmit, isEditing, orgsLoading, organizations, orgsError]);

  if (orgsLoading) return <Loader />;
  if (orgsError) return <ErrorMsg message={orgsError} />;
  if (!organizations || organizations.length === 0) {
    return <ErrorMsg message="No organizations found. Cannot create division." />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          // React Hook Form validation
          const isValid = await form.trigger();
          if (!isValid) {
            // Collect all error messages, including nested ones
            const collectErrors = (errorsObj, path = []) => {
              let messages = [];
              for (const key in errorsObj) {
                if (errorsObj[key]?.message) {
                  messages.push(`${[...path, key].join('.').replace(/\.(\d+)/g, '[$1]')}: ${errorsObj[key].message}`);
                } else if (typeof errorsObj[key] === 'object' && errorsObj[key] !== null) {
                  messages = messages.concat(collectErrors(errorsObj[key], [...path, key]));
                }
              }
              return messages;
            };
            const allErrors = collectErrors(form.formState.errors || {});
            const errorMsg = allErrors.length > 0
              ? allErrors.join('\n')
              : 'Please fix form errors before submitting.';
            toast({
              title: 'Validation Error',
              description: errorMsg,
              variant: 'destructive',
              duration: 8000,
            });
            return;
          }
          form.handleSubmit(handleSubmit)(e);
        }}
        className="space-y-8"
      >
        <DivisionMainFields
          control={form.control}
          organizations={organizations || []}
          selectedOrg={selectedOrg}
          isSubmitting={isSubmitting}
          isEditing={isEditingFromHook}
          form={form}
        />

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-4">Contacts</h3>
          <ContactForm 
            contacts={form.watch("contacts")} 
            onChange={handleContactsChange}
          />
          {/* No error message for minimum contacts enforced here */}
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">References</h3>
          <ReferenceForm 
            references={form.watch("references")} 
            onChange={handleReferencesChange}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="btn btn-outline"
            disabled={isSubmitting}
            onClick={() => {
              // Add navigation or reset logic if desired
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : isEditingFromHook ? "Update Division" : "Create Division"}
          </button>
        </div>
      </form>
    </Form>
  );
};

export default DivisionForm;
