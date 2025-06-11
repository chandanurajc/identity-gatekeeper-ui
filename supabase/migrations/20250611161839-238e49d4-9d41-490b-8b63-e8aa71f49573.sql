
-- Create purchase_order table
CREATE TABLE public.purchase_order (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number VARCHAR NOT NULL UNIQUE,
  division_id UUID REFERENCES public.organizations(id),
  supplier_id UUID REFERENCES public.organizations(id),
  po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_delivery_date DATE,
  ship_to_address_1 TEXT,
  ship_to_address_2 TEXT,
  ship_to_postal_code VARCHAR,
  ship_to_city VARCHAR,
  ship_to_state VARCHAR,
  ship_to_country VARCHAR,
  ship_to_phone VARCHAR,
  ship_to_email VARCHAR,
  payment_terms VARCHAR DEFAULT 'Net 30',
  notes TEXT,
  tracking_number VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'Created',
  organization_id UUID REFERENCES public.organizations(id),
  created_by TEXT NOT NULL,
  created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT,
  updated_on TIMESTAMP WITH TIME ZONE
);

-- Create purchase_order_line table
CREATE TABLE public.purchase_order_line (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_order(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  item_id VARCHAR NOT NULL REFERENCES public.items(id),
  quantity DECIMAL(10,2) NOT NULL,
  uom VARCHAR NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_unit_price DECIMAL(10,2) NOT NULL,
  gst_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  gst_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  created_by TEXT NOT NULL,
  created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT,
  updated_on TIMESTAMP WITH TIME ZONE,
  UNIQUE(purchase_order_id, line_number)
);

-- Create indexes for better performance
CREATE INDEX idx_purchase_order_po_number ON public.purchase_order(po_number);
CREATE INDEX idx_purchase_order_supplier ON public.purchase_order(supplier_id);
CREATE INDEX idx_purchase_order_division ON public.purchase_order(division_id);
CREATE INDEX idx_purchase_order_organization ON public.purchase_order(organization_id);
CREATE INDEX idx_purchase_order_line_po_id ON public.purchase_order_line(purchase_order_id);
CREATE INDEX idx_purchase_order_line_item ON public.purchase_order_line(item_id);

-- Add permissions for Purchase Order management
INSERT INTO public.permissions (name, module, component, description) VALUES
('Create PO', 'Order Management', 'Purchase Order', 'Access to Create PO page'),
('Edit PO', 'Order Management', 'Purchase Order', 'Access to Edit PO page'),
('View PO', 'Order Management', 'Purchase Order', 'Access to view PO list/details');
