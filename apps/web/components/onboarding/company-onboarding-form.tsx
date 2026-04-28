"use client";
import { axiosInstance } from "@/lib/axios";
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
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyOnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [size, setSize] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCompanyOnboard = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await axiosInstance.post("/api/v1/onboarding/company", {
        name,
        size,
        website,
        address,
        state: stateValue,
        city,
        pin_code: pinCode,
      });

      setSuccessMessage("Company registered successfully.");
      setIsSubmitting(false);
      // navigate to plan selection next
      router.push("/onboarding/plan");
    } catch (err: unknown) {
      setIsSubmitting(false);
      let msg = "Failed to register company";
      if (typeof err === "object" && err !== null) {
        const e = err as { message?: string; response?: any };
        msg = e.response?.data?.error || e.message || msg;
      }
      setErrorMessage(msg);
    }
  };

  return (
    <div className="flex items-center justify-center p-10">
      <div className="sm:mx-auto sm:max-w-2xl">
        <h3 className="text-2xl font-semibold text-balance text-foreground dark:text-foreground">
          Company Onboarding
        </h3>
        <p className="mt-1 text-sm text-pretty text-muted-foreground dark:text-muted-foreground">
          Take a few moments to register for your company&apos;s wallet
        </p>
        <form onSubmit={handleCompanyOnboard} className="mt-8">
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </Field>
            </div>
            <div className="col-span-full">
              <Field className="gap-2">
                <FieldLabel htmlFor="email">
                  Company Size
                  <span className="text-red-500">*</span>
                </FieldLabel>
                <Select value={size} onValueChange={(v) => setSize(v)}>
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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
                  value={stateValue}
                  onChange={(e) => setStateValue(e.target.value)}
                />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-2">
              <Field className="gap-2">
                <FieldLabel htmlFor="pin-code">Pin code</FieldLabel>
                <Input
                  id="pin-code"
                  name="pin-code"
                  autoComplete="pin-code"
                  placeholder="Pin Code"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
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
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer whitespace-nowrap" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Next"}
            </Button>
          </div>
          {errorMessage ? (
            <p className="mt-4 text-sm text-destructive">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="mt-4 text-sm text-emerald-600">{successMessage}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
