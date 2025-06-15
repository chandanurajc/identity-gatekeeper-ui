
import { Separator } from "@/components/ui/separator";
import { ContactForm } from "./ContactForm";
import { ReferenceForm } from "./ReferenceForm";
import { DivisionMainFields } from "./DivisionMainFields";
import { useDivisionForm } from "./hooks/useDivisionForm";

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
  } = useDivisionForm({ initialData, onSubmit, isEditing });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        // React Hook Form validation
        const isValid = await form.trigger();
        if (!isValid) {
          toast({
            title: "Validation Error",
            description: "Please fix form errors before submitting.",
            variant: "destructive",
          });
          return;
        }
        form.handleSubmit(handleSubmit)(e);
      }}
      className="space-y-8"
    >
      <DivisionMainFields
        control={form.control}
        organizations={organizations}
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
        {form.formState.errors.contacts && (
          <p className="text-sm font-medium text-destructive mt-2">
            {form.formState.errors.contacts?.message || "At least one contact is required"}
          </p>
        )}
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
  );
};

export default DivisionForm;
