
import { Supplier, SupplierFormData } from "@/types/supplier";
import { v4 as uuidv4 } from "uuid";

// Mock data for suppliers
const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "ABC Corporation",
    alias: "ABC Corp",
    status: "active",
    references: [
      { id: "ref1", type: "GST", value: "GST123456789" },
      { id: "ref2", type: "PAN", value: "PAN987654321" }
    ],
    contacts: [
      {
        id: "contact1",
        type: "Registered location",
        firstName: "John",
        lastName: "Doe",
        address1: "123 Main St",
        address2: "Suite 101",
        postalCode: "12345",
        city: "New York",
        state: "NY",
        country: "USA",
        phoneNumber: "+1-555-123-4567",
        email: "john.doe@abccorp.com",
        website: "www.abccorp.com"
      }
    ],
    createdBy: "System",
    createdOn: new Date("2024-05-01"),
  },
  {
    id: "2",
    name: "XYZ Industries",
    alias: "XYZ",
    status: "active",
    references: [
      { id: "ref3", type: "CIN", value: "CIN12345ABC" }
    ],
    contacts: [
      {
        id: "contact2",
        type: "Billing",
        firstName: "Jane",
        lastName: "Smith",
        address1: "456 Business Ave",
        postalCode: "54321",
        city: "Los Angeles",
        state: "CA",
        country: "USA",
        email: "jane.smith@xyzindustries.com"
      }
    ],
    createdBy: "System",
    createdOn: new Date("2024-05-02"),
  }
];

// Mock data for suppliers
let suppliers = [...mockSuppliers];

export const supplierService = {
  getAllSuppliers: (): Promise<Supplier[]> => {
    return Promise.resolve([...suppliers]);
  },

  getSupplierById: (id: string): Promise<Supplier | undefined> => {
    const supplier = suppliers.find(supplier => supplier.id === id);
    return Promise.resolve(supplier);
  },

  createSupplier: (supplier: SupplierFormData, createdBy: string): Promise<Supplier> => {
    const newSupplier: Supplier = {
      ...supplier,
      id: uuidv4(),
      createdBy: createdBy,
      createdOn: new Date(),
    };
    suppliers.push(newSupplier);
    return Promise.resolve(newSupplier);
  },

  updateSupplier: (id: string, supplierData: Partial<SupplierFormData>, updatedBy: string): Promise<Supplier | undefined> => {
    let updatedSupplier: Supplier | undefined;
    suppliers = suppliers.map(supplier => {
      if (supplier.id === id) {
        updatedSupplier = {
          ...supplier,
          ...supplierData,
          updatedBy: updatedBy,
          updatedOn: new Date(),
        };
        return updatedSupplier;
      }
      return supplier;
    });
    return Promise.resolve(updatedSupplier);
  },

  deleteSupplier: (id: string): Promise<boolean> => {
    const initialLength = suppliers.length;
    suppliers = suppliers.filter(supplier => supplier.id !== id);
    return Promise.resolve(suppliers.length !== initialLength);
  }
};
