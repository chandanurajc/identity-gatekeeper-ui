
import { Organization } from './organization';

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
  status: 'Created' | 'Approved' | 'Received' | 'Partially Received' | 'Cancelled';
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
  supplier?: Partial<Organization>;
  organization?: Organization;
  lines?: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
  id?: string;
  purchaseOrderId?: string;
  lineNumber: number;
  itemId: string;
  quantity: number;
  receivedQuantity?: number;
  uom: string;
  unitPrice: number;
  totalUnitPrice: number;
  gstPercent: number;
  gstValue: number;
  lineTotal: number;
  itemWeightPerUnit?: number;
  itemWeightUom?: string;
  totalLineWeight?: number;
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
    weight?: number;
    weightUom?: string;
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
  shipToStateCode?: number;
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

export interface POReceiveTransaction {
  id: string;
  organizationId: string;
  purchaseOrderId: string;
  purchaseOrderLineId: string;
  itemId: string;
  quantityReceived: number;
  uom: string;
  receivedOn: Date;
  receivedBy: string; // user id
  createdOn: Date;
}

export interface POReceiveLineData {
    lineNumber: number;
    itemId: string;
    itemDescription: string;
    orderedQuantity: number;
    totalReceivedQuantity: number;
    quantityToReceive: number;
    uom: string;
    purchaseOrderLineId: string;
}

export interface POReceiveFormData {
    poId: string;
    poNumber: string;
    supplierName: string;
    poDate: string;
    divisionName: string;
    lines: POReceiveLineData[];
}
