
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { SalesChannelFormData } from "@/types/salesChannel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SalesChannelFormProps {
  initialData?: SalesChannelFormData;
  onSubmit: (data: SalesChannelFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

const SalesChannelForm: React.FC<SalesChannelFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SalesChannelFormData>({
    defaultValues: initialData || {
      name: "",
      status: "active",
    },
  });

  const watchedStatus = watch("status");

  const handleFormSubmit = async (data: SalesChannelFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success(`Sales channel ${isEdit ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} sales channel`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Sales Channel" : "Create Sales Channel"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Sales Channel Name*</Label>
            <Input
              id="name"
              {...register("name", { required: "Sales channel name is required" })}
              placeholder="Enter sales channel name"
              disabled={isEdit}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status*</Label>
            <Select value={watchedStatus} onValueChange={(value) => setValue("status", value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="under_development">Under Development</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SalesChannelForm;
