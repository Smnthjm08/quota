"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { DepositDialog } from "./deposit-dialog";
// import { WithdrawDialog } from "./withdraw-dialog";
import { Plus, ArrowRightLeft } from "lucide-react";

type VaultActionsProps = {
  onDeposited?: () => Promise<void> | void;
};

export function VaultActions({ onDeposited }: VaultActionsProps) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [, setWithdrawOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={() => setDepositOpen(true)}
        size="default"
        className="cursor-pointer"
      >
        <Plus className="mr-2 size-4" />
        Deposit USDC
      </Button>
      <Button
        onClick={() => setWithdrawOpen(true)}
        size="default"
        variant="outline"
        className="cursor-pointer"
      >
        <ArrowRightLeft className="mr-2 size-4" />
        Withdraw All
      </Button>
      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        onDeposited={onDeposited}
      />
      {/* <WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} /> */}
    </div>
  );
}
