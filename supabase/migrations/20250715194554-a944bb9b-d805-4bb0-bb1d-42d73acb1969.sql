-- Add Bill To fields to purchase_order table
ALTER TABLE purchase_order ADD COLUMN bill_to_org_id UUID;
ALTER TABLE purchase_order ADD COLUMN bill_to_name TEXT;
ALTER TABLE purchase_order ADD COLUMN bill_to_address1 TEXT;
ALTER TABLE purchase_order ADD COLUMN bill_to_address2 TEXT;
ALTER TABLE purchase_order ADD COLUMN bill_to_city CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN bill_to_state CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN bill_to_state_code SMALLINT;
ALTER TABLE purchase_order ADD COLUMN bill_to_country CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN bill_to_postal_code CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN bill_to_email CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN bill_to_phone CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN bill_to_gstin CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN bill_to_cin CHARACTER VARYING;

-- Add Remit To fields to purchase_order table
ALTER TABLE purchase_order ADD COLUMN remit_to_org_id UUID;
ALTER TABLE purchase_order ADD COLUMN remit_to_name TEXT;
ALTER TABLE purchase_order ADD COLUMN remit_to_address1 TEXT;
ALTER TABLE purchase_order ADD COLUMN remit_to_address2 TEXT;
ALTER TABLE purchase_order ADD COLUMN remit_to_city CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN remit_to_state CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN remit_to_state_code SMALLINT;
ALTER TABLE purchase_order ADD COLUMN remit_to_country CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN remit_to_postal_code CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN remit_to_email CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN remit_to_phone CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN remit_to_gstin CHARACTER VARYING;
ALTER TABLE purchase_order ADD COLUMN remit_to_cin CHARACTER VARYING;

-- Create purchase_order_gst_breakdown table
CREATE TABLE purchase_order_gst_breakdown (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID NOT NULL,
    gst_percentage NUMERIC NOT NULL,
    taxable_amount NUMERIC NOT NULL,
    cgst_percentage NUMERIC DEFAULT 0,
    cgst_amount NUMERIC DEFAULT 0,
    sgst_percentage NUMERIC DEFAULT 0,
    sgst_amount NUMERIC DEFAULT 0,
    igst_percentage NUMERIC DEFAULT 0,
    igst_amount NUMERIC DEFAULT 0,
    total_gst_amount NUMERIC NOT NULL,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id) ON DELETE CASCADE
);

-- Add foreign key constraints for bill_to_org_id and remit_to_org_id
ALTER TABLE purchase_order ADD CONSTRAINT fk_purchase_order_bill_to_org 
    FOREIGN KEY (bill_to_org_id) REFERENCES organizations(id);
ALTER TABLE purchase_order ADD CONSTRAINT fk_purchase_order_remit_to_org 
    FOREIGN KEY (remit_to_org_id) REFERENCES organizations(id);

-- Add foreign key constraints for state codes
ALTER TABLE purchase_order ADD CONSTRAINT fk_purchase_order_bill_to_state_code 
    FOREIGN KEY (bill_to_state_code) REFERENCES india_state_code(state_code);
ALTER TABLE purchase_order ADD CONSTRAINT fk_purchase_order_remit_to_state_code 
    FOREIGN KEY (remit_to_state_code) REFERENCES india_state_code(state_code);

-- Enable RLS on purchase_order_gst_breakdown
ALTER TABLE purchase_order_gst_breakdown ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase_order_gst_breakdown
CREATE POLICY "Users can manage PO GST breakdown within their own organization" 
ON purchase_order_gst_breakdown
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM purchase_order po 
        WHERE po.id = purchase_order_gst_breakdown.purchase_order_id 
        AND po.organization_id = get_user_organization_id(auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM purchase_order po 
        WHERE po.id = purchase_order_gst_breakdown.purchase_order_id 
        AND po.organization_id = get_user_organization_id(auth.uid())
    )
);