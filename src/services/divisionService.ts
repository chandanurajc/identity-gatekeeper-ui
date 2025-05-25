
import { Division, DivisionFormData } from "@/types/division";
import { organizationService } from "./organizationService";
import { v4 as uuidv4 } from "uuid";

// Mock data for divisions
let divisions: Division[] = [
  {
    id: "div-1",
    code: "ABCC001",
    name: "ABC Supplier Division",
    organizationId: "1",
    organizationCode: "ABCC",
    organizationName: "ABC Corporation",
    type: "Supplier",
    status: "active",
    references: [
      { id: "ref1", type: "GST", value: "GST123456789" }
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
  }
];

const validateDivisionCode = (code: string, excludeId?: string): boolean => {
  // Check if code is exactly 7 characters (4 org code + 3 user code)
  if (!/^[A-Za-z0-9]{7}$/.test(code)) {
    return false;
  }
  
  // Check uniqueness
  const existingDiv = divisions.find(div => 
    div.code.toLowerCase() === code.toLowerCase() && div.id !== excludeId
  );
  
  return !existingDiv;
};

export const divisionService = {
  getAllDivisions: (): Promise<Division[]> => {
    return Promise.resolve([...divisions]);
  },

  getDivisionById: (id: string): Promise<Division | undefined> => {
    const division = divisions.find(division => division.id === id);
    return Promise.resolve(division);
  },

  getDivisionByCode: (code: string): Promise<Division | undefined> => {
    const division = divisions.find(div => 
      div.code.toLowerCase() === code.toLowerCase()
    );
    return Promise.resolve(division);
  },

  validateDivisionCode: (code: string, excludeId?: string): Promise<boolean> => {
    return Promise.resolve(validateDivisionCode(code, excludeId));
  },

  createDivision: async (divisionData: DivisionFormData, createdBy: string): Promise<Division> => {
    // Get organization details
    const organization = await organizationService.getOrganizationById(divisionData.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const fullCode = organization.code + divisionData.userDefinedCode;
    
    // Check if a division with this code already exists
    const existingDiv = divisions.find(div => 
      div.code.toLowerCase() === fullCode.toLowerCase()
    );
    
    if (existingDiv) {
      throw new Error("A division with this code already exists");
    }
    
    const newDivision: Division = {
      ...divisionData,
      id: uuidv4(),
      code: fullCode,
      organizationCode: organization.code,
      organizationName: organization.name,
      createdBy: createdBy,
      createdOn: new Date(),
    };
    divisions.push(newDivision);
    return Promise.resolve(newDivision);
  },

  updateDivision: async (id: string, divisionData: Partial<DivisionFormData>, updatedBy: string): Promise<Division | undefined> => {
    if (divisionData.organizationId && divisionData.userDefinedCode) {
      const organization = await organizationService.getOrganizationById(divisionData.organizationId);
      if (!organization) {
        throw new Error("Organization not found");
      }
      
      const fullCode = organization.code + divisionData.userDefinedCode;
      if (!validateDivisionCode(fullCode, id)) {
        throw new Error("Division code must be exactly 7 characters (4 org + 3 user) and unique");
      }
    }
    
    let updatedDivision: Division | undefined;
    divisions = divisions.map(division => {
      if (division.id === id) {
        const updates: any = { ...divisionData };
        
        // Handle organization change
        if (divisionData.organizationId && divisionData.userDefinedCode) {
          const organization = divisions.find(d => d.id === id)?.organizationCode;
          updates.code = divisionData.organizationId + divisionData.userDefinedCode;
        }
        
        updatedDivision = {
          ...division,
          ...updates,
          updatedBy: updatedBy,
          updatedOn: new Date(),
        };
        return updatedDivision;
      }
      return division;
    });
    return Promise.resolve(updatedDivision);
  },

  deleteDivision: (id: string): Promise<boolean> => {
    const initialLength = divisions.length;
    divisions = divisions.filter(division => division.id !== id);
    return Promise.resolve(divisions.length !== initialLength);
  }
};
