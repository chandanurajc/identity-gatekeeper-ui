
export interface Organization {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'Admin' | 'Customer' | 'Supplier' | 'Partner';
  status: 'active' | 'inactive';
  references: Reference[];
  contacts: Contact[];
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface OrganizationFormData {
  code: string;
  name: string;
  description?: string;
  type: 'Admin' | 'Customer' | 'Supplier' | 'Partner';
  status: 'active' | 'inactive';
  references: Reference[];
  contacts: Contact[];
}

export interface Contact {
  id?: string;
  type: 'Registered location' | 'Billing' | 'Shipping' | 'Owner' | 'Bill To' | 'Remit To';
  firstName: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  stateCode?: number;
  country?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
}

export interface Reference {
  id?: string;
  type: 'GST' | 'CIN' | 'PAN';
  value: string;
}
