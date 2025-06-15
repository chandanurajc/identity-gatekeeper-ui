
-- Add new permissions for dashboard widgets
INSERT INTO public.permissions (name, module, component, description)
VALUES
  ('View Open PO Widget', 'Order Management', 'Purchase Orders', 'Allows user to view the Open Purchase Orders widget on the dashboard'),
  ('View Payables Summary Widget', 'Dashboard', 'Finance', 'Allows user to view the Total Payables to All Orgs widget on the dashboard')
ON CONFLICT (name) DO NOTHING;

-- Add RPC function to calculate total payables for the dashboard widget
CREATE OR REPLACE FUNCTION public.get_total_payables(p_organization_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  WITH balances AS (
    SELECT
      remit_to_orgid,
      SUM(
        CASE
          WHEN transaction_type IN ('Payment', 'Credit Note') THEN amount
          ELSE -amount
        END
      ) as balance
    FROM general_ledger
    WHERE bill_to_orgid = p_organization_id
    GROUP BY remit_to_orgid
  )
  SELECT COALESCE(SUM(-balance), 0)
  FROM balances
  WHERE balance < 0; -- Only sum up where there is a payable balance
$$;
