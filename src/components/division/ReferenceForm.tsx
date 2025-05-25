
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reference } from "@/types/division";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface ReferenceFormProps {
  references: Reference[];
  onChange: (references: Reference[]) => void;
}

export const ReferenceForm = ({ references, onChange }: ReferenceFormProps) => {
  const [newReference, setNewReference] = useState<Partial<Reference>>({});

  const handleAddReference = () => {
    if (!newReference.type || !newReference.value) {
      return;
    }

    const reference: Reference = {
      id: uuidv4(),
      type: newReference.type,
      value: newReference.value,
    };

    onChange([...references, reference]);
    setNewReference({});
  };

  const handleRemoveReference = (referenceId: string) => {
    const updatedReferences = references.filter(ref => ref.id !== referenceId);
    onChange(updatedReferences);
  };

  return (
    <div className="space-y-4">
      {/* Add new reference form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="referenceType">Reference Type</Label>
              <Select 
                value={newReference.type || ""} 
                onValueChange={(value) => setNewReference({...newReference, type: value as Reference['type']})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GST">GST</SelectItem>
                  <SelectItem value="CIN">CIN</SelectItem>
                  <SelectItem value="PAN">PAN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="referenceValue">Reference Value</Label>
              <Input
                id="referenceValue"
                value={newReference.value || ""}
                onChange={(e) => setNewReference({...newReference, value: e.target.value})}
                placeholder="Enter reference value"
              />
            </div>

            <div className="flex items-end">
              <Button type="button" onClick={handleAddReference}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display existing references */}
      {references.length > 0 && (
        <div className="space-y-2">
          <Label>Current References</Label>
          {references.map((reference) => (
            <Card key={reference.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{reference.type}:</span>
                    <span className="ml-2">{reference.value}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveReference(reference.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
