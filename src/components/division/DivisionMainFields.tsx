import { ControllerRenderProps } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Organization } from "@/types/organization";
import { DivisionFormData } from "@/types/division";

interface DivisionMainFieldsProps {
  control: any;
  organizations: Organization[];
  selectedOrg: Organization | undefined;
  isSubmitting: boolean;
  isEditing: boolean;
  form: any;
}

export function DivisionMainFields({
  control,
  organizations,
  selectedOrg,
  isSubmitting,
  isEditing,
  form,
}: DivisionMainFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={control}
        name="organizationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization *</FormLabel>
            <Select
              disabled={isSubmitting || isEditing}
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.code} - {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="userDefinedCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Division Code *</FormLabel>
            <FormControl>
              <div className="flex items-center space-x-2">
                <Input
                  value={selectedOrg?.code || "----"}
                  disabled
                  className="w-20 text-center bg-gray-100"
                />
                <span>+</span>
                <Input
                  placeholder="Enter 3-character code"
                  {...field}
                  maxLength={3}
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  className="w-24"
                  disabled={isSubmitting || isEditing}
                  value={field.value}
                  readOnly={isEditing}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Division Name *</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter division name"
                {...field}
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Division Type *</FormLabel>
            <Select
              disabled={isSubmitting}
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select division type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Supplier">Supplier</SelectItem>
                <SelectItem value="Retailer">Retailer</SelectItem>
                <SelectItem value="Retail customer">Retail Customer</SelectItem>
                <SelectItem value="Wholesale customer">Wholesale Customer</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status *</FormLabel>
            <Select
              disabled={isSubmitting}
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
