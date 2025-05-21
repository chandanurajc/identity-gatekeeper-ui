
import { Category } from "@/types/category";
import { v4 as uuidv4 } from "uuid";

// Mock data for categories
const mockCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    isActive: true,
    createdBy: "System",
    createdOn: new Date("2024-05-01"),
  },
  {
    id: "2",
    name: "Furniture",
    isActive: true,
    createdBy: "System",
    createdOn: new Date("2024-05-01"),
  },
  {
    id: "3",
    name: "Clothing",
    isActive: false,
    createdBy: "System",
    createdOn: new Date("2024-05-01"),
  }
];

// Categories data store
let categories = [...mockCategories];

export const categoryService = {
  getAllCategories: (): Promise<Category[]> => {
    return Promise.resolve([...categories]);
  },

  getCategoryById: (id: string): Promise<Category | undefined> => {
    const category = categories.find(category => category.id === id);
    return Promise.resolve(category);
  },

  createCategory: (category: Omit<Category, "id" | "createdBy" | "createdOn">): Promise<Category> => {
    const newCategory: Category = {
      ...category,
      id: uuidv4(),
      createdBy: "Current User", // In a real app, this would come from the authenticated user
      createdOn: new Date(),
    };
    categories.push(newCategory);
    return Promise.resolve(newCategory);
  },

  updateCategory: (id: string, categoryData: Partial<Category>): Promise<Category | undefined> => {
    let updatedCategory: Category | undefined;
    categories = categories.map(category => {
      if (category.id === id) {
        updatedCategory = {
          ...category,
          ...categoryData,
          updatedBy: "Current User", // In a real app, this would come from the authenticated user
          updatedOn: new Date(),
        };
        return updatedCategory;
      }
      return category;
    });
    return Promise.resolve(updatedCategory);
  },

  deleteCategory: (id: string): Promise<boolean> => {
    const initialLength = categories.length;
    categories = categories.filter(category => category.id !== id);
    return Promise.resolve(categories.length !== initialLength);
  }
};
