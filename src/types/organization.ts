
export interface Reference {
  id: string;
  type: 'GST' | 'CIN' | 'PAN' | 'GS1Code';
  value: string;
}

export interface Contact {
  id: string;
  type: 'Registered location' | 'Billing' | 'Shipping' | 'Owner' | 'Bill To' | 'Remit To';
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  alias?: string;
  type: 'Supplier' | 'Retailer' | 'Wholesale Customer' | 'Retail Customer' | 'Admin';
  status: 'active' | 'inactive';
  references: Reference[];
  contacts: Contact[];
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface OrganizationFormData {
  name: string;
  code: string;
  alias?: string;
  type: 'Supplier' | 'Retailer' | 'Wholesale Customer' | 'Retail Customer' | 'Admin';
  status: 'active' | 'inactive';
  references: Reference[];
  contacts: Contact[];
}
