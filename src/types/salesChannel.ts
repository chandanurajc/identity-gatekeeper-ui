
export interface SalesChannel {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'under_development' | 'maintenance';
  organizationId?: string;
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface SalesChannelFormData {
  name: string;
  status: 'active' | 'inactive' | 'under_development' | 'maintenance';
}
