
export interface InventoryStock {
    id: string;
    organizationId: string;
    itemId: string;
    divisionId: string;
    quantity: number;
    uom: string;
    transactionType: 'PO_RECEIVE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'SALES_ORDER';
    referenceNumber?: string;
    createdBy: string;
    createdOn: Date;
    updatedBy?: string;
    updatedOn?: Date;
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
}
