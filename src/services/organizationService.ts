import { Organization, OrganizationFormData } from "@/types/organization";
import { v4 as uuidv4 } from "uuid";

// Mock data for organizations
const mockOrganizations: Organization[] = [
  {
    id: "1",
    name: "ABC Corporation",
    code: "ABCC",
    alias: "ABC Corp",
    type: "Supplier",
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
    code: "XYZI",
    alias: "XYZ",
    type: "Retailer",
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

// Mock data for organizations
let organizations = [...mockOrganizations];

const validateOrganizationCode = (code: string, excludeId?: string): boolean => {
  // Check if code is exactly 4 characters and alphanumeric
  if (!/^[A-Za-z0-9]{4}$/.test(code)) {
    return false;
  }
  
  // Check uniqueness
  const existingOrg = organizations.find(org => 
    org.code.toLowerCase() === code.toLowerCase() && org.id !== excludeId
  );
  
  return !existingOrg;
};

export const organizationService = {
  getAllOrganizations: (): Promise<Organization[]> => {
    return Promise.resolve([...organizations]);
  },

  getOrganizationById: (id: string): Promise<Organization | undefined> => {
    const organization = organizations.find(organization => organization.id === id);
    return Promise.resolve(organization);
  },

  getOrganizationByCode: (code: string): Promise<Organization | undefined> => {
    const organization = organizations.find(org => 
      org.code.toLowerCase() === code.toLowerCase()
    );
    return Promise.resolve(organization);
  },

  validateOrganizationCode: (code: string, excludeId?: string): Promise<boolean> => {
    return Promise.resolve(validateOrganizationCode(code, excludeId));
  },

  createOrganization: (organization: OrganizationFormData, createdBy: string): Promise<Organization> => {
    if (!validateOrganizationCode(organization.code)) {
      throw new Error("Organization code must be exactly 4 alphanumeric characters and unique");
    }
    
    const newOrganization: Organization = {
      ...organization,
      id: uuidv4(),
      createdBy: createdBy,
      createdOn: new Date(),
    };
    organizations.push(newOrganization);
    return Promise.resolve(newOrganization);
  },

  updateOrganization: (id: string, organizationData: Partial<OrganizationFormData>, updatedBy: string): Promise<Organization | undefined> => {
    if (organizationData.code && !validateOrganizationCode(organizationData.code, id)) {
      throw new Error("Organization code must be exactly 4 alphanumeric characters and unique");
    }
    
    let updatedOrganization: Organization | undefined;
    organizations = organizations.map(organization => {
      if (organization.id === id) {
        updatedOrganization = {
          ...organization,
          ...organizationData,
          updatedBy: updatedBy,
          updatedOn: new Date(),
        };
        return updatedOrganization;
      }
      return organization;
    });
    return Promise.resolve(updatedOrganization);
  },

  deleteOrganization: (id: string): Promise<boolean> => {
    const initialLength = organizations.length;
    organizations = organizations.filter(organization => organization.id !== id);
    return Promise.resolve(organizations.length !== initialLength);
  }
};
