
import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  code: z.string()
    .length(4, "Code must be exactly 4 characters")
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase alphanumeric")
    .transform(val => val.toUpperCase()),
  alias: z.string()
    .max(200, "Alias must be less than 200 characters")
    .optional()
    .transform(val => val?.trim() || undefined),
  type: z.enum(["Supplier", "Retailer", "Wholesale Customer", "Retail Customer", "Admin"], {
    required_error: "Organization type is required",
  }),
  status: z.enum(["active", "inactive"]),
  contacts: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["Registered location", "Billing", "Shipping", "Owner", "Bill To", "Remit To"]),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      address1: z.string().optional(),
      address2: z.string().optional(),
      postalCode: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      phoneNumber: z.string().optional(),
      email: z.string().email("Invalid email address").optional().or(z.literal("")),
      website: z.string().optional(),
    })
  ),
  references: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["GST", "CIN", "PAN", "GS1Code"]),
      value: z.string().min(1, "Reference value is required"),
    })
  ).optional().default([]),
});
