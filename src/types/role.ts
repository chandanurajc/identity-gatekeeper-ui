
import { User } from "./auth";

export interface Permission {
  id: string;
  name: string;
  module: string;
  component: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface RoleFormData {
  name: string;
  permissions: Permission[];
}
