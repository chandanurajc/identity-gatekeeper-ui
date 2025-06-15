export interface Reference {
  id: string;
  type: 'GST' | 'CIN' | 'PAN';
  value: string;
}

export interface Contact {
  id: string;
  type: 'Registered location' | 'Billing' | 'Shipping' | 'Owner' | 'Bill To' | 'Remit To';
  firstName: string;
  lastName?: string;
  address1: string;
  address2?: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  phoneNumber: string;
  email?: string;
  website?: string;
}

export interface Division {
  id: string;
  code: string;
  name: string;
  organizationId: string;
  organizationCode: string;
  organizationName: string;
  type: 'Supplier' | 'Retailer' | 'Retail customer' | 'Wholesale customer';
  status: 'active' | 'inactive';
  references: Reference[];
  contacts: Contact[];
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface DivisionFormData {
  name: string;
  organizationId: string;
  userDefinedCode: string;
  type: 'Supplier' | 'Retailer' | 'Retail customer' | 'Wholesale customer';
  status: 'active' | 'inactive';
  references: Reference[];
  contacts: Contact[];
}
