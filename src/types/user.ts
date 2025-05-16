
export type UserRole = "admin" | "user" | "guest" | string;

export interface PhoneNumber {
  countryCode: string;
  number: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  phone?: PhoneNumber;
  designation?: string;
  roles: UserRole[];
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
  email: string;
  password?: string;
  confirmPassword?: string;
  phone: {
    countryCode: string;
    number: string;
  };
  designation?: string;
  roles: UserRole[];
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface Permission {
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
