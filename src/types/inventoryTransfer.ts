export interface InventoryTransfer {
  id: string;
  transfer_number: string;
  organization_id: string;
  origin_division_id: string;
  destination_division_id: string;
  transfer_date: string;
  tracking_number?: string;
  status: 'Transfer initiated' | 'Transfer confirmed';
  created_on: Date;
  updated_on?: Date;
  created_by: string;
  updated_by?: string;
  // UI fields
  origin_division_name?: string;
  destination_division_name?: string;
  transfer_lines?: InventoryTransferLine[];
}

export interface InventoryTransferLine {
  id: string;
  transfer_id: string;
  line_number: number;
  item_id: string;
  quantity_to_transfer: number;
  created_on: Date;
  updated_on?: Date;
  // UI fields
  item_description?: string;
  origin_quantity?: number;
  destination_quantity?: number;
}

export interface InventoryTransferFormData {
  origin_division_id: string;
  destination_division_id: string;
  transfer_date: string;
  tracking_number?: string;
  transfer_lines: InventoryTransferLineFormData[];
}

export interface InventoryTransferLineFormData {
  item_id: string;
  quantity_to_transfer: number;
}

export interface CreateInventoryTransferData {
  organization_id: string;
  origin_division_id: string;
  destination_division_id: string;
  transfer_date: string;
  tracking_number?: string;
  created_by: string;
  transfer_lines: {
    line_number: number;
    item_id: string;
    quantity_to_transfer: number;
  }[];
}