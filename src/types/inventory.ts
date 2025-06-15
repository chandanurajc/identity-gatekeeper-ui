
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
