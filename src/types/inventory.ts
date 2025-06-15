
export interface InventoryStock {
    id: string;
    organization_id: string;
    item_id: string;
    division_id: string;
    quantity: number;
    uom: string;
    transaction_type: 'PO_RECEIVE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'SALES_ORDER';
    reference_number?: string;
    created_by: string;
    created_on: Date;
    updated_by?: string;
    updated_on?: Date;
}

export interface InventoryStockLedgerItem extends InventoryStock {
    item?: {
        description: string;
    };
    division?: {
        name: string;
    };
}

export interface InventoryStockSummaryItem {
  item_id: string;
  item_description: string;
  division_id: string;
  division_name: string;
  quantity_available: number;
  uom: string;
  last_updated_on: string;
  item_group_name: string | null;
  classification: string;
  sub_classification: string;
}
