import React, { useEffect } from "react";
import { Controller, useWatch } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const sectionTitleClass = "text-base font-semibold text-muted-foreground tracking-tight mb-1";

const ShipToAddressSection = ({
  control,
  register,
  errors,
  watchedDivisionId,
  loadDivisionShippingAddress,
  resetShippingFields
}) => {
  const sameAsDivisionAddress = useWatch({ control, name: "sameAsDivisionAddress" });

  useEffect(() => {
    if (sameAsDivisionAddress && watchedDivisionId) {
      loadDivisionShippingAddress();
    } else if (!sameAsDivisionAddress) {
      resetShippingFields();
    }
    // eslint-disable-next-line
  }, [sameAsDivisionAddress, watchedDivisionId]);

  return (
    <section className="bg-transparent pt-2">
      <h2 className={sectionTitleClass}>Ship to Address</h2>
      <div className="flex items-center space-x-2 mb-2 mt-1">
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
          {errors.shipToAddress1 && <p className="text-xs text-red-500">{errors.shipToAddress1.message}</p>}
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
          {errors.shipToPostalCode && <p className="text-xs text-red-500">{errors.shipToPostalCode.message}</p>}
        </div>
        <div>
          <Label htmlFor="shipToCity">City *</Label>
          <Input
            id="shipToCity"
            {...register("shipToCity", { required: "City is required" })}
            disabled={sameAsDivisionAddress}
          />
          {errors.shipToCity && <p className="text-xs text-red-500">{errors.shipToCity.message}</p>}
        </div>
        <div>
          <Label htmlFor="shipToState">State *</Label>
          <Input
            id="shipToState"
            {...register("shipToState", { required: "State is required" })}
            disabled={sameAsDivisionAddress}
          />
          {errors.shipToState && <p className="text-xs text-red-500">{errors.shipToState.message}</p>}
        </div>
        <div>
          <Label htmlFor="shipToCountry">Country *</Label>
          <Input
            id="shipToCountry"
            {...register("shipToCountry", { required: "Country is required" })}
            disabled={sameAsDivisionAddress}
          />
          {errors.shipToCountry && <p className="text-xs text-red-500">{errors.shipToCountry.message}</p>}
        </div>
        <div>
          <Label htmlFor="shipToPhone">Phone *</Label>
          <Input
            id="shipToPhone"
            {...register("shipToPhone", { required: "Phone is required" })}
            disabled={sameAsDivisionAddress}
          />
          {errors.shipToPhone && <p className="text-xs text-red-500">{errors.shipToPhone.message}</p>}
        </div>
        <div>
          <Label htmlFor="shipToEmail">Email *</Label>
          <Input
            id="shipToEmail"
            type="email"
            {...register("shipToEmail", { required: "Email is required" })}
            disabled={sameAsDivisionAddress}
          />
          {errors.shipToEmail && <p className="text-xs text-red-500">{errors.shipToEmail.message}</p>}
        </div>
      </div>
    </section>
  );
};

export default ShipToAddressSection;
