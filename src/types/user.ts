
export type UserRole = "admin" | "user" | "guest" | string;

export interface PhoneNumber {
  countryCode: string;
  number: string;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  password?: string;
  phone?: PhoneNumber;
  designation?: string;
  roles: UserRole[];
  permissions?: string[];
  name?: string;
  status?: string;
  organizationId?: string;
  organizationName?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdBy: string;
  createdOn: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  username: string;
  password?: string;
  confirmPassword?: string;
  phone: {
    countryCode: string;
    number: string;
  };
  designation?: string;
  organizationId: string;
  roles: UserRole[];
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface Permission {
  id: string;
  module: string;
  component: string;
  name: string;
  description: string;
}

export interface UserPermission {
  module: string;
  component: string;
  permissions: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  organizationId?: string;
  organizationName?: string;
}
