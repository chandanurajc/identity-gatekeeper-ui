import { z } from "zod";

// Moved from DivisionForm.tsx:
export const divisionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  organizationId: z.string().min(1, "Organization is required"),
  userDefinedCode: z
    .string()
    .length(3, "User code must be exactly 3 characters")
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase alphanumeric"),
  type: z.enum(["Supplier", "Retailer", "Retail customer", "Wholesale customer"]),
  status: z.enum(["active", "inactive"]),
  contacts: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["Registered location", "Billing", "Shipping", "Owner"]),
        firstName: z.string().min(2, "First name must be at least 2 characters"),
        lastName: z.string().optional(),
        address1: z.string().min(1, "Address 1 is required"),
        address2: z.string().optional(),
        postalCode: z.string().min(1, "Postal code is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        country: z.string().min(1, "Country is required"),
        phoneNumber: z.string().min(1, "Phone number is required"),
        email: z.string().email("Invalid email address").optional(),
        website: z.string().optional(),
        stateCode: z.number().optional(),
      })
    )
    // NO min(1)!
    ,
  references: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["GST", "CIN", "PAN"]),
        value: z.string().min(1, "Reference value is required"),
      })
    )
    .optional()
    .default([]),
});
