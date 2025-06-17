
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
  weightUom?: 'g' | 'kg';
  image?: string;
  organizationId?: string;
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
  costs?: ItemCost[];
  prices?: ItemPrice[];
}

export interface ItemCost {
  id: string;
  itemId: string;
  supplierId: string;
  supplierName?: string;
  cost: number;
  organizationId?: string;
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface ItemPrice {
  id: string;
  itemId: string;
  salesChannelId: string;
  salesChannelName?: string;
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
  weightUom?: 'g' | 'kg';
  image?: string;
  costs: ItemCostFormData[];
  prices: ItemPriceFormData[];
}

export interface ItemCostFormData {
  supplierId: string;
  cost: number;
}

export interface ItemPriceFormData {
  salesChannelId: string;
  price: number;
}
