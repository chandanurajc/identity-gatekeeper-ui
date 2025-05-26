import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserFormData, UserRole } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { roleService } from "@/services/roleService";
import { organizationService } from "@/services/organizationService";
import { Organization } from "@/types/organization";
import { Role } from "@/types/role";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MultiSelect } from "@/components/ui/multi-select";

// Form schema including validation
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().email("Invalid email format"),
  email: z.string().email("Invalid email format"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  designation: z.string().optional(),
  organizationId: z.string().min(1, "Organization is required"),
  roles: z.array(z.string()).min(1, "At least one role must be selected"),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  effectiveTo: z.string().optional(),
}).refine(data => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => {
  if (data.password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,16})/;
    return passwordRegex.test(data.password);
  }
  return true;
}, {
  message: "Password must contain at least 1 lowercase letter, 1 number, 1 special character, and be 8-16 characters long",
  path: ["password"],
});

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  isEditing?: boolean;
  onSubmit: (data: UserFormData) => Promise<void>;
}

const UserForm = ({ initialData, isEditing = false, onSubmit }: UserFormProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<{ label: string; value: string }[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch available roles and organizations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roles, orgs] = await Promise.all([
          roleService.getRoles(),
          organizationService.getOrganizations()
        ]);
        
        const formattedRoles = roles.map(role => ({
          label: role.name,
          value: role.name.toLowerCase(),
        }));
        
        setAvailableRoles(formattedRoles);
        setOrganizations(orgs);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "There was a problem loading the roles or organizations."
        });
        console.error("Error loading data:", error);
      } finally {
        setIsLoadingRoles(false);
        setIsLoadingOrganizations(false);
      }
    };

    fetchData();
  }, [toast]);

  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      username: initialData?.username || "",
      email: initialData?.email || "",
      password: "",
      confirmPassword: "",
      phoneCountryCode: initialData?.phone?.countryCode || "+1",
      phoneNumber: initialData?.phone?.number || "",
      designation: initialData?.designation || "",
      organizationId: initialData?.organizationId || "",
      roles: initialData?.roles || [],
      effectiveFrom: initialData?.effectiveFrom 
        ? new Date(initialData.effectiveFrom).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      effectiveTo: initialData?.effectiveTo
        ? new Date(initialData.effectiveTo).toISOString().split('T')[0]
        : "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Transform form data to match UserFormData structure
      const userData: UserFormData = {
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        phone: {
          countryCode: values.phoneCountryCode,
          number: values.phoneNumber,
        },
        designation: values.designation,
        organizationId: values.organizationId,
        roles: values.roles,
        effectiveFrom: new Date(values.effectiveFrom),
        effectiveTo: values.effectiveTo ? new Date(values.effectiveTo) : undefined,
      };

      await onSubmit(userData);

      toast({
        title: `User ${isEditing ? "updated" : "created"} successfully`,
        description: `The user has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      
      navigate("/admin/users");
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Failed to ${isEditing ? "update" : "create"} user`,
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    navigate("/admin/users");
  };

  return (
    <>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="grid grid-cols-2 gap-6 pt-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email ID/Username*</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email*</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditing ? "New Password" : "Password"}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Re-enter Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="phoneCountryCode"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormLabel>Country Code*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Phone Number*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization dropdown */}
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingOrganizations ? (
                          <SelectItem value="loading" disabled>Loading organizations...</SelectItem>
                        ) : (
                          organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roles*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        {isLoadingRoles ? (
                          <div className="text-sm text-muted-foreground">Loading roles...</div>
                        ) : (
                          <MultiSelect
                            options={availableRoles}
                            selected={field.value}
                            onChange={field.onChange}
                            placeholder="Select roles..."
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effectiveFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective From*</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effectiveTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective To</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Save Changes" : "Save"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose all unsaved changes. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, continue editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Yes, discard changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserForm;
