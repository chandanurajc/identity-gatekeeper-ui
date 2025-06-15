
import React, { useEffect } from "react";
import { Controller, useWatch } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PurchaseOrderFormData } from "@/types/purchaseOrder";

interface ShipToAddressSectionProps {
  control: any;
  register: any;
  errors: any;
  watchedDivisionId: string;
  loadDivisionShippingAddress: () => void;
  resetShippingFields: () => void;
}

const ShipToAddressSection: React.FC<ShipToAddressSectionProps> = ({
  control,
  register,
  errors,
  watchedDivisionId,
  loadDivisionShippingAddress,
  resetShippingFields
}) => {
  // Watch the checkbox value
  const sameAsDivisionAddress = useWatch({ control, name: "sameAsDivisionAddress" });

  // Effect to run loading when checked
  useEffect(() => {
    if (sameAsDivisionAddress && watchedDivisionId) {
      loadDivisionShippingAddress();
    } else if (!sameAsDivisionAddress) {
      resetShippingFields();
    }
    // eslint-disable-next-line
  }, [sameAsDivisionAddress, watchedDivisionId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ship to Address</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Controller
            name="sameAsDivisionAddress"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="sameAsDivisionAddress"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="sameAsDivisionAddress">Same as Division's Shipping address?</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="shipToAddress1">Address 1 *</Label>
            <Input
              id="shipToAddress1"
              {...register("shipToAddress1", { required: "Address 1 is required" })}
              disabled={sameAsDivisionAddress}
            />
            {errors.shipToAddress1 && <p className="text-sm text-red-500">{errors.shipToAddress1.message}</p>}
          </div>
          <div>
            <Label htmlFor="shipToAddress2">Address 2</Label>
            <Input
              id="shipToAddress2"
              {...register("shipToAddress2")}
              disabled={sameAsDivisionAddress}
            />
          </div>
          <div>
            <Label htmlFor="shipToPostalCode">Postal Code *</Label>
            <Input
              id="shipToPostalCode"
              {...register("shipToPostalCode", { required: "Postal Code is required" })}
              disabled={sameAsDivisionAddress}
            />
            {errors.shipToPostalCode && <p className="text-sm text-red-500">{errors.shipToPostalCode.message}</p>}
          </div>
          <div>
            <Label htmlFor="shipToCity">City *</Label>
            <Input
              id="shipToCity"
              {...register("shipToCity", { required: "City is required" })}
              disabled={sameAsDivisionAddress}
            />
            {errors.shipToCity && <p className="text-sm text-red-500">{errors.shipToCity.message}</p>}
          </div>
          <div>
            <Label htmlFor="shipToState">State *</Label>
            <Input
              id="shipToState"
              {...register("shipToState", { required: "State is required" })}
              disabled={sameAsDivisionAddress}
            />
            {errors.shipToState && <p className="text-sm text-red-500">{errors.shipToState.message}</p>}
          </div>
          <div>
            <Label htmlFor="shipToCountry">Country *</Label>
            <Input
              id="shipToCountry"
              {...register("shipToCountry", { required: "Country is required" })}
              disabled={sameAsDivisionAddress}
            />
            {errors.shipToCountry && <p className="text-sm text-red-500">{errors.shipToCountry.message}</p>}
          </div>
          <div>
            <Label htmlFor="shipToPhone">Phone *</Label>
            <Input
              id="shipToPhone"
              {...register("shipToPhone", { required: "Phone is required" })}
              disabled={sameAsDivisionAddress}
            />
            {errors.shipToPhone && <p className="text-sm text-red-500">{errors.shipToPhone.message}</p>}
          </div>
          <div>
            <Label htmlFor="shipToEmail">Email *</Label>
            <Input
              id="shipToEmail"
              type="email"
              {...register("shipToEmail", { required: "Email is required" })}
              disabled={sameAsDivisionAddress}
            />
            {errors.shipToEmail && <p className="text-sm text-red-500">{errors.shipToEmail.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShipToAddressSection;
