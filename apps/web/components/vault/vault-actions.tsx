"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { DepositDialog } from "./deposit-dialog";
import { WithdrawDialog } from "./withdraw-dialog";
import { Plus, ArrowRightLeft } from "lucide-react";

export function VaultActions() {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => setDepositOpen(true)} size="default" className="cursor-pointer">
        <Plus className="size-4 mr-2" />
        Deposit USDC
      </Button>
      <Button onClick={() => setWithdrawOpen(true)} size="default" variant="outline" className="cursor-pointer">
        <ArrowRightLeft className="size-4 mr-2" />
        Withdraw All
      </Button>
      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
      />
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
      />
    </div>
  );
}
