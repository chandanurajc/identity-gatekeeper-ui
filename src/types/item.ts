
export interface Item {
  id: string;
  description: string;
  itemGroupId?: string;
  classification: string;
  subClassification: string;
  status: 'active' | 'inactive';
  barcode?: string;
  gstPercentage: number;
  uom: string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  image?: string;
  organizationId?: string;
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
  costs?: ItemCost[];
}

export interface ItemCost {
  id: string;
  itemId: string;
  supplierId?: string;
  supplierName?: string;
  price: number;
  organizationId?: string;
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface ItemFormData {
  id?: string;
  description: string;
  itemGroupId?: string;
  classification: string;
  subClassification: string;
  status: 'active' | 'inactive';
  barcode?: string;
  gstPercentage: number;
  uom: string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  image?: string;
  costs: ItemCostFormData[];
}

export interface ItemCostFormData {
  supplierId?: string;
  price: number;
}
