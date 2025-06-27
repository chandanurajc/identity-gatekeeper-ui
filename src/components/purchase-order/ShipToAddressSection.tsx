import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IndianStateSelect } from "@/components/ui/indian-state-select";
import { Control, UseFormRegister, FieldErrors, UseFormSetValue, useWatch } from "react-hook-form";
import { PurchaseOrderFormData } from "@/types/purchaseOrder";

interface ShipToAddressSectionProps {
  control: Control<PurchaseOrderFormData>;
  register: UseFormRegister<PurchaseOrderFormData>;
  errors: FieldErrors<PurchaseOrderFormData>;
  watchedDivisionId: string;
  loadDivisionShippingAddress: () => void;
  resetShippingFields: () => void;
  setValue: UseFormSetValue<PurchaseOrderFormData>;
}

const ShipToAddressSection: React.FC<ShipToAddressSectionProps> = ({
  control,
  register,
  errors,
  watchedDivisionId,
  loadDivisionShippingAddress,
  resetShippingFields,
  setValue
}) => {
  const [sameAsDivision, setSameAsDivision] = React.useState(false);
  const [currentState, setCurrentState] = React.useState("");
  const [currentStateCode, setCurrentStateCode] = React.useState<number | undefined>();

  // Sync local state with form values
  const watchedShipToState = useWatch({ control, name: "shipToState" });
  const watchedShipToStateCode = useWatch({ control, name: "shipToStateCode" });
  React.useEffect(() => {
    setCurrentState(watchedShipToState || "");
    setCurrentStateCode(watchedShipToStateCode || undefined);
  }, [watchedShipToState, watchedShipToStateCode]);

  const handleSameAsDivisionChange = (checked: boolean) => {
    setSameAsDivision(checked);
    setValue("sameAsDivisionAddress", checked);
    
    if (checked && watchedDivisionId) {
      loadDivisionShippingAddress();
    } else {
      resetShippingFields();
    }
  };

  const handleStateChange = (stateName: string, stateCode: number) => {
    console.log('Shipping address state changed:', stateName, 'State code:', stateCode);
    setCurrentState(stateName);
    setCurrentStateCode(stateCode);
    setValue("shipToState", stateName);
    setValue("shipToStateCode", stateCode);
  };

  return (
    <section className="bg-transparent">
      <h2 className="text-base font-semibold text-muted-foreground tracking-tight mb-1">Ship To Address</h2>
      
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="sameAsDivision"
          checked={sameAsDivision}
          onCheckedChange={handleSameAsDivisionChange}
          disabled={!watchedDivisionId}
        />
        <Label htmlFor="sameAsDivision" className="text-sm">
          Same as Division Registered Address
        </Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div>
          <Label htmlFor="shipToAddress1">Address 1</Label>
          <Input
            id="shipToAddress1"
            {...register("shipToAddress1")}
            placeholder="Enter address line 1"
          />
        </div>
        <div>
          <Label htmlFor="shipToAddress2">Address 2</Label>
          <Input
            id="shipToAddress2"
            {...register("shipToAddress2")}
            placeholder="Enter address line 2"
          />
        </div>
        <div>
          <Label htmlFor="shipToCity">City</Label>
          <Input
            id="shipToCity"
            {...register("shipToCity")}
            placeholder="Enter city"
          />
        </div>
        <div>
          <Label htmlFor="shipToState">State</Label>
          <IndianStateSelect
            value={currentState}
            onValueChange={handleStateChange}
            placeholder="Select state"
          />
        </div>
        <div>
          <Label htmlFor="shipToStateCode">State Code</Label>
          <Input
            id="shipToStateCode"
            value={currentStateCode || ""}
            readOnly
            placeholder="Auto-filled from state selection"
            className="bg-muted"
          />
        </div>
        <div>
          <Label htmlFor="shipToPostalCode">Postal Code</Label>
          <Input
            id="shipToPostalCode"
            {...register("shipToPostalCode")}
            placeholder="Enter postal code"
          />
        </div>
        <div>
          <Label htmlFor="shipToCountry">Country</Label>
          <Input
            id="shipToCountry"
            {...register("shipToCountry")}
            placeholder="Enter country"
          />
        </div>
        <div>
          <Label htmlFor="shipToPhone">Phone</Label>
          <Input
            id="shipToPhone"
            {...register("shipToPhone")}
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <Label htmlFor="shipToEmail">Email</Label>
          <Input
            id="shipToEmail"
            type="email"
            {...register("shipToEmail")}
            placeholder="Enter email address"
          />
        </div>
      </div>
    </section>
  );
};

export default ShipToAddressSection;
