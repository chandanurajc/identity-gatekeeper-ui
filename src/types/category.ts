
export interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdBy?: string;
  createdOn?: Date;
  updatedBy?: string;
  updatedOn?: Date;
}

export interface CategoryFormData {
  name: string;
  isActive: boolean;
}
