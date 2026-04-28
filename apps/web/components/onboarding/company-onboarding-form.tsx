import { Button } from "@workspace/ui/components/button";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";

export default function CompanyOnboardingForm() {
  return (
    <div className="flex items-center justify-center p-10">
      <div className="sm:mx-auto sm:max-w-2xl">
        <h3 className="text-2xl font-semibold text-balance text-foreground dark:text-foreground">
          Company Onboarding
        </h3>
        <p className="mt-1 text-sm text-pretty text-muted-foreground dark:text-muted-foreground">
          Take a few moments to register for your company&apos;s wallet
        </p>
        <form action="#" method="post" className="mt-8">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="name">
                  Name
                  <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Name"
                  required
                />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="website">
                  Website
                  <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  type="text"
                  id="website"
                  name="website"
                  autoComplete="website"
                  placeholder="Website"
                  required
                />
              </Field>
            </div>
            <div className="col-span-full">
              <Field className="gap-2">
                <FieldLabel htmlFor="email">
                  Company Size
                  <span className="text-red-500">*</span>
                </FieldLabel>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10</SelectItem>
                    <SelectItem value="11-50">11-50</SelectItem>
                    <SelectItem value="51-200">51-200</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="col-span-full">
              <Field className="gap-2">
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  placeholder="Address"
                />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-2">
              <Field className="gap-2">
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input
                  type="text"
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  placeholder="City"
                />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-2">
              <Field className="gap-2">
                <FieldLabel htmlFor="state">State</FieldLabel>
                <Input
                  type="text"
                  id="state"
                  name="state"
                  autoComplete="address-level1"
                  placeholder="State"
                />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-2">
              <Field className="gap-2">
                <FieldLabel htmlFor="postal-code">Postal code</FieldLabel>
                <Input
                  id="postal-code"
                  name="postal-code"
                  autoComplete="postal-code"
                  placeholder="Postal code"
                />
              </Field>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              className="whitespace-nowrap"
            >
              Cancel
            </Button>
            <Button type="submit" className="whitespace-nowrap">
              Next
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
