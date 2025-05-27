
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Reference } from "@/types/organization";
import { v4 as uuidv4 } from "uuid";

interface ReferenceFormProps {
  references: Reference[];
  onChange: (references: Reference[]) => void;
}

const REFERENCE_TYPES = [
  { value: "GST", label: "GST" },
  { value: "CIN", label: "CIN" },
  { value: "PAN", label: "PAN" },
  { value: "GS1 Company code", label: "GS1 Company code" }
] as const;

export const ReferenceForm = ({ references, onChange }: ReferenceFormProps) => {
  const [internalReferences, setInternalReferences] = useState<Reference[]>(references);

  useEffect(() => {
    console.log("ReferenceForm: Props changed, updating internal state:", references);
    setInternalReferences(references);
  }, [references]);

  const addReference = () => {
    console.log("ReferenceForm: Adding new reference");
    const newReference: Reference = {
      id: uuidv4(),
      type: 'GST',
      value: '',
    };
    const updatedReferences = [...internalReferences, newReference];
    console.log("ReferenceForm: Updated references:", updatedReferences);
    setInternalReferences(updatedReferences);
    onChange(updatedReferences);
  };

  const removeReference = (index: number) => {
    console.log("ReferenceForm: Removing reference at index:", index);
    const updatedReferences = internalReferences.filter((_, i) => i !== index);
    console.log("ReferenceForm: Updated references after removal:", updatedReferences);
    setInternalReferences(updatedReferences);
    onChange(updatedReferences);
  };

  const updateReference = (index: number, field: keyof Reference, value: string) => {
    console.log(`ReferenceForm: Updating reference ${index} field ${field}:`, value);
    
    // Ensure we're working with valid reference types
    if (field === 'type') {
      const validType = REFERENCE_TYPES.find(t => t.value === value);
      if (!validType) {
        console.error("Invalid reference type:", value);
        return;
      }
    }
    
    const updatedReferences = internalReferences.map((ref, i) => 
      i === index ? { ...ref, [field]: value } : ref
    );
    console.log("ReferenceForm: Updated references:", updatedReferences);
    setInternalReferences(updatedReferences);
    onChange(updatedReferences);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">References</h4>
        <Button type="button" onClick={addReference} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Reference
        </Button>
      </div>

      {internalReferences.map((reference, index) => (
        <Card key={`ref-${index}-${reference.id}`} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Reference Type</Label>
              <Select 
                value={reference.type} 
                onValueChange={(value) => updateReference(index, 'type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reference type" />
                </SelectTrigger>
                <SelectContent>
                  {REFERENCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Reference Value</Label>
              <Input
                value={reference.value}
                onChange={(e) => updateReference(index, 'value', e.target.value)}
                placeholder="Enter reference value"
              />
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeReference(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      {internalReferences.length === 0 && (
        <p className="text-muted-foreground text-center py-4">
          No references added yet. Click "Add Reference" to get started.
        </p>
      )}
    </div>
  );
};
