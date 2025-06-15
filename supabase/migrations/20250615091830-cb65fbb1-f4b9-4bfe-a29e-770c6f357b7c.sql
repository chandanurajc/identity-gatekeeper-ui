
-- Step 1: Add received_quantity to purchase_order_line table
ALTER TABLE public.purchase_order_line
ADD COLUMN IF NOT EXISTS received_quantity NUMERIC NOT NULL DEFAULT 0;

-- Step 2: Create po_receive_transaction table
CREATE TABLE IF NOT EXISTS public.po_receive_transaction (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_order(id),
    purchase_order_line_id UUID NOT NULL REFERENCES public.purchase_order_line(id),
    item_id CHARACTER VARYING NOT NULL REFERENCES public.items(id),
    quantity_received NUMERIC NOT NULL CHECK (quantity_received > 0),
    uom CHARACTER VARYING NOT NULL,
    received_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_by UUID NOT NULL,
    created_on TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Create inventory_stock table
CREATE TABLE IF NOT EXISTS public.inventory_stock (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    item_id CHARACTER VARYING NOT NULL REFERENCES public.items(id),
    division_id UUID NOT NULL REFERENCES public.divisions(id),
    quantity NUMERIC NOT NULL,
    uom CHARACTER VARYING NOT NULL,
    transaction_type CHARACTER VARYING NOT NULL CHECK (transaction_type IN ('PO_RECEIVE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'SALES_ORDER')),
    reference_number TEXT,
    created_by TEXT NOT NULL,
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT,
    updated_on TIMESTAMPTZ
);

-- Step 4: Add RLS policies for new tables
-- RLS for po_receive_transaction
ALTER TABLE public.po_receive_transaction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage PO receipts within their own organization"
ON public.po_receive_transaction
FOR ALL
USING (organization_id = public.get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS for inventory_stock
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage inventory stock within their own organization"
ON public.inventory_stock
FOR ALL
USING (organization_id = public.get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

-- Step 5: Insert new permissions
INSERT INTO public.permissions (name, module, component, description)
VALUES
    ('View PO Receive', 'Order Management', 'PO Receive', 'Access PO receive list/details'),
    ('Create PO Receive', 'Order Management', 'PO Receive', 'Submit receive entries'),
    ('View Inventory', 'Inventory', 'Stock Ledger', 'View inventory transactions')
ON CONFLICT (name) DO NOTHING;

