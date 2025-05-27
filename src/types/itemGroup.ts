
export interface ItemGroup {
  id: string;
  name: string;
  classification: string;
  subClassification: string;
  status: 'active' | 'inactive';
  organizationId: string;
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface ItemGroupFormData {
  name: string;
  classification: string;
  subClassification: string;
  status: 'active' | 'inactive';
}
