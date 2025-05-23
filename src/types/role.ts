
export interface Permission {
  id: string;
  name: string;
  module: string;
  component: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  organizationId?: string;
  organizationName?: string;
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface RoleFormData {
  name: string;
  permissions: Permission[];
  organizationId?: string;
}
