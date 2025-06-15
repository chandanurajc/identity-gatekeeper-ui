
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  divisionId: string;
  supplierId: string;
  poDate: string;
  requestedDeliveryDate?: string;
  shipToAddress1?: string;
  shipToAddress2?: string;
  shipToPostalCode?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToCountry?: string;
  shipToPhone?: string;
  shipToEmail?: string;
  paymentTerms: string;
  notes?: string;
  trackingNumber?: string;
  status: 'Created' | 'Approved' | 'Received';
  organizationId: string;
  createdBy: string;
  createdOn: Date;
  updatedBy?: string;
  updatedOn?: Date;
  
  // Related data
  division?: {
    name: string;
    code: string;
  };
  supplier?: {
    name: string;
    code: string;
  };
  lines?: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
  id?: string;
  purchaseOrderId?: string;
  lineNumber: number;
  itemId: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  totalUnitPrice: number;
  gstPercent: number;
  gstValue: number;
  lineTotal: number;
  organizationId?: string;
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
  
  // Related data
  item?: {
    id: string;
    description: string;
    classification: string;
    subClassification: string;
    itemGroupId?: string;
    itemGroup?: {
      name: string;
      classification: string;
      subClassification: string;
    };
  };
}

export interface PurchaseOrderFormData {
  poNumber: string;
  divisionId: string;
  supplierId: string;
  poDate: string;
  requestedDeliveryDate?: string;
  sameAsDivisionAddress: boolean;
  shipToAddress1: string;
  shipToAddress2?: string;
  shipToPostalCode: string;
  shipToCity: string;
  shipToState: string;
  shipToCountry: string;
  shipToPhone: string;
  shipToEmail: string;
  paymentTerms: string;
  notes?: string;
  trackingNumber?: string;
  lines: PurchaseOrderLine[];
}

export interface ShippingAddress {
  address1: string;
  address2?: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
}
