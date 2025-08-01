

export interface Reference {
  id: string;
  type: 'GST' | 'CIN' | 'PAN';
  value: string;
}

export interface Contact {
  id: string;
  type: 'Registered location' | 'Billing' | 'Shipping' | 'Owner';
  firstName: string;
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

export interface Supplier {
  id: string;
  name: string;
  alias?: string;
  status: 'active' | 'inactive';
  references: Reference[];
  contacts: Contact[];
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface SupplierFormData {
  name: string;
  alias?: string;
  status: 'active' | 'inactive';
  references: Reference[];
  contacts: Contact[];
}

