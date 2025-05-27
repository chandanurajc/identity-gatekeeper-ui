
import { useState } from "react";
import { Reference } from "@/types/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ReferenceFormProps {
  references: Reference[];
  onChange: (references: Reference[]) => void;
  readOnly?: boolean;
}

export const ReferenceForm = ({ references, onChange, readOnly = false }: ReferenceFormProps) => {
  const [newReference, setNewReference] = useState<Omit<Reference, 'id'>>({
    type: 'GST',
    value: ''
  });

  const handleAddReference = () => {
    if (newReference.value.trim() !== '') {
      const reference: Reference = {
        ...newReference,
        id: uuidv4()
      };
      onChange([...references, reference]);
      setNewReference({ type: 'GST', value: '' });
    }
  };

  const handleRemoveReference = (id: string) => {
    onChange(references.filter(ref => ref.id !== id));
  };

  const referenceTypes = ['GST', 'CIN', 'PAN', 'GS1 Company code'];

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex flex-col space-y-4 p-4 border rounded-md bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="referenceType">Reference Type</Label>
              <Select
                value={newReference.type}
                onValueChange={(value) => setNewReference({ ...newReference, type: value as Reference['type'] })}
              >
                <SelectTrigger id="referenceType">
                  <SelectValue placeholder="Select reference type" />
                </SelectTrigger>
                <SelectContent>
                  {referenceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="referenceValue">Reference Value</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="referenceValue"
                  value={newReference.value}
                  onChange={(e) => setNewReference({ ...newReference, value: e.target.value })}
                  placeholder="Enter reference value"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddReference} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {references.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {references.map(reference => (
            <Card key={reference.id} className="bg-card">
              <CardHeader className="py-2 px-4 flex flex-row justify-between items-center">
                <CardTitle className="text-sm font-medium">{reference.type}</CardTitle>
                {!readOnly && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveReference(reference.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="py-2 px-4">
                <p className="text-sm">{reference.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
