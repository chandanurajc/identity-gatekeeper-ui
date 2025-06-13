
-- Create a dedicated divisions table
CREATE TABLE public.divisions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code character varying NOT NULL UNIQUE,
  name text NOT NULL,
  organization_id uuid NOT NULL,
  type character varying NOT NULL CHECK (type IN ('Supplier', 'Retailer', 'Retail customer', 'Wholesale customer')),
  status character varying NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by text,
  created_on timestamp with time zone NOT NULL DEFAULT now(),
  updated_by text,
  updated_on timestamp with time zone
);

-- Create division_references table for GST, CIN, PAN etc
CREATE TABLE public.division_references (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  reference_type character varying NOT NULL CHECK (reference_type IN ('GST', 'CIN', 'PAN')),
  reference_value character varying NOT NULL,
  created_on timestamp with time zone NOT NULL DEFAULT now(),
  updated_on timestamp with time zone DEFAULT now()
);

-- Create division_contacts table for contact information
CREATE TABLE public.division_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  contact_type character varying NOT NULL CHECK (contact_type IN ('Registered location', 'Billing', 'Shipping', 'Owner')),
  first_name character varying NOT NULL,
  last_name character varying,
  address1 text,
  address2 text,
  postal_code character varying,
  city character varying,
  state character varying,
  country character varying,
  phone_number character varying,
  email character varying,
  website character varying,
  created_on timestamp with time zone NOT NULL DEFAULT now(),
  updated_on timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_divisions_organization_id ON public.divisions(organization_id);
CREATE INDEX idx_divisions_status ON public.divisions(status);
CREATE INDEX idx_division_references_division_id ON public.division_references(division_id);
CREATE INDEX idx_division_contacts_division_id ON public.division_contacts(division_id);

-- Add unique constraint to prevent duplicate reference types per division
ALTER TABLE public.division_references ADD CONSTRAINT unique_division_reference_type UNIQUE (division_id, reference_type);

-- Add unique constraint to prevent duplicate contact types per division
ALTER TABLE public.division_contacts ADD CONSTRAINT unique_division_contact_type UNIQUE (division_id, contact_type);
