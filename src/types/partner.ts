
export interface Partner {
  id: string;
  organizationId: string;
  organizationCode: string;
  organizationName: string;
  organizationType: string;
  currentOrganizationId: string;
  status: 'active' | 'inactive';
  partnershipDate: Date;
  createdBy: string;
  createdOn: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface PartnerFormData {
  organizationIds: string[];
}

export interface OrganizationSearchResult {
  id: string;
  code: string;
  name: string;
  type: string;
  gstNumber?: string;
}
