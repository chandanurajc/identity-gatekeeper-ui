
import { Organization } from './organization';

export type POType = 'Consumables' | 'Assets' | 'Finished goods' | 'Raw materials';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  divisionId: string;
  supplierId: string;
  poDate: string;
  requestedDeliveryDate?: string;
  poType?: POType;
  shipToAddress1?: string;
  shipToAddress2?: string;
  shipToPostalCode?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToStateCode?: number;
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
  
  // Bill To fields
  billToOrgId?: string;
  billToName?: string;
  billToAddress1?: string;
  billToAddress2?: string;
  billToCity?: string;
  billToState?: string;
  billToStateCode?: number;
  billToCountry?: string;
  billToPostalCode?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToGstin?: string;
  billToCin?: string;
  
  // Remit To fields
  remitToOrgId?: string;
  remitToContactId?: string;  // Add contact ID
  remitToName?: string;
  remitToAddress1?: string;
  remitToAddress2?: string;
  remitToCity?: string;
  remitToState?: string;
  remitToStateCode?: number;
  remitToCountry?: string;
  remitToPostalCode?: string;
  remitToEmail?: string;
  remitToPhone?: string;
  remitToGstin?: string;
  remitToCin?: string;
  
  // Related data
  division?: {
    name: string;
    code: string;
  };
  supplier?: Partial<Organization>;
  organization?: Organization;
  lines?: PurchaseOrderLine[];
  gstBreakdown?: PurchaseOrderGSTBreakdown[];
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
  poType?: string;
  
  // Bill To fields
  billToOrgId?: string;
  billToName?: string;
  billToAddress1?: string;
  billToAddress2?: string;
  billToCity?: string;
  billToState?: string;
  billToStateCode?: number;
  billToCountry?: string;
  billToPostalCode?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToGstin?: string;
  billToCin?: string;
  
  // Remit To fields
  remitToOrgId?: string;
  remitToContactId?: string;  // Add contact ID
  remitToName?: string;
  remitToAddress1?: string;
  remitToAddress2?: string;
  remitToCity?: string;
  remitToState?: string;
  remitToStateCode?: number;
  remitToCountry?: string;
  remitToPostalCode?: string;
  remitToEmail?: string;
  remitToPhone?: string;
  remitToGstin?: string;
  remitToCin?: string;
}

export interface ShippingAddress {
  address1: string;
  address2?: string;
  postalCode: string;
  city: string;
  state: string;
  stateCode?: number;
  country: string;
  phoneNumber: string;
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

export interface PurchaseOrderGSTBreakdown {
  id?: string;
  purchaseOrderId?: string;
  gstPercentage: number;
  taxableAmount: number;
  cgstPercentage?: number;
  cgstAmount?: number;
  sgstPercentage?: number;
  sgstAmount?: number;
  igstPercentage?: number;
  igstAmount?: number;
  totalGstAmount: number;
}
