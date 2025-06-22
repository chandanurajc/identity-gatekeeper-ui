
-- Create enum for file types
CREATE TYPE attachment_file_type AS ENUM ('display_picture', 'other_document');

-- Create item_attachments table
CREATE TABLE public.item_attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    item_id VARCHAR NOT NULL,
    file_name TEXT NOT NULL,
    file_type attachment_file_type NOT NULL,
    secure_url TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_on TIMESTAMP WITH TIME ZONE NULL,
    FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE
);

-- Add RLS policies for multi-tenant access
ALTER TABLE public.item_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see attachments from their organization
CREATE POLICY "Users can view attachments from their organization"
    ON public.item_attachments
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can insert attachments for their organization
CREATE POLICY "Users can insert attachments for their organization"
    ON public.item_attachments
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can update attachments from their organization
CREATE POLICY "Users can update attachments from their organization"
    ON public.item_attachments
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can delete attachments from their organization
CREATE POLICY "Users can delete attachments from their organization"
    ON public.item_attachments
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX idx_item_attachments_organization_id ON public.item_attachments(organization_id);
CREATE INDEX idx_item_attachments_item_id ON public.item_attachments(item_id);
CREATE INDEX idx_item_attachments_is_default ON public.item_attachments(item_id, is_default) WHERE is_default = true;
