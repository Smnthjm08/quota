"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { XCircle } from "lucide-react";
import { useState } from "react";
import { CloseVaultDialog } from "@/components/vault/close-vault-dialog";

export default function SettingsPage() {
  const [closeOpen, setCloseOpen] = useState(false);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Closing the vault is separate from withdrawing funds. Withdraw
                the balance first, then close only when the vault is inactive.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                variant="destructive"
                onClick={() => setCloseOpen(true)}
                className="cursor-pointer"
              >
                <XCircle className="mr-2 size-4" />
                Close Vault
              </Button>
            </CardContent>
          </Card>
        </div>{" "}
      </div>

      <CloseVaultDialog open={closeOpen} onOpenChange={setCloseOpen} />
    </div>
  );
}
