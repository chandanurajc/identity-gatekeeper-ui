-- Update the inventory stock summary function to properly handle TRANSFER transactions
CREATE OR REPLACE FUNCTION public.get_inventory_stock_summary(p_organization_id uuid, p_include_zero_stock boolean DEFAULT false)
 RETURNS TABLE(item_id character varying, item_description text, division_id uuid, division_name text, quantity_available numeric, uom character varying, last_updated_on timestamp with time zone, item_group_name text, classification character varying, sub_classification character varying)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    WITH aggregated_stock AS (
        SELECT
            inv.item_id,
            inv.division_id,
            SUM(
                CASE
                    WHEN inv.transaction_type IN ('PO_RECEIVE', 'ADJUSTMENT_IN') THEN inv.quantity
                    WHEN inv.transaction_type IN ('SALES_ORDER', 'ADJUSTMENT_OUT') THEN -inv.quantity
                    WHEN inv.transaction_type = 'TRANSFER' THEN inv.quantity
                    ELSE 0
                END
            ) AS calculated_quantity,
            MAX(inv.created_on) as max_created_on,
            MAX(i.uom) as item_uom,
            MAX(i.description) as item_desc,
            MAX(d.name) as div_name,
            MAX(ig.name) as item_group,
            MAX(i.classification) as item_classification,
            MAX(i.sub_classification) as item_sub_classification
        FROM
            public.inventory_stock inv
        JOIN public.items i ON inv.item_id = i.id
        LEFT JOIN public.item_groups ig ON i.item_group_id = ig.id AND ig.organization_id = i.organization_id
        JOIN public.divisions d ON inv.division_id = d.id
        WHERE
            inv.organization_id = p_organization_id
            AND i.organization_id = p_organization_id
            AND d.organization_id = p_organization_id
        GROUP BY
            inv.item_id, inv.division_id
    )
    SELECT
        agg.item_id::character varying,
        agg.item_desc::text,
        agg.division_id::uuid,
        agg.div_name::text,
        agg.calculated_quantity::numeric,
        agg.item_uom::character varying,
        agg.max_created_on::timestamp with time zone,
        agg.item_group::text,
        agg.item_classification::character varying,
        agg.item_sub_classification::character varying
    FROM
        aggregated_stock agg
    WHERE
        p_include_zero_stock OR agg.calculated_quantity <> 0;
END;
$function$