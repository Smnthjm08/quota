import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type { QuotaVault } from "../../types/quota_vault.ts";
import idl from "../../idl/quota_vault.json" with { type: "json" };

const USDC_SCALE = 1_000_000;

function formatUsdcAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(value);
}

export interface UpdateSeatResult {
  transaction: Transaction;
  vaultAllocation: {
    totalDepositedHuman: number;
    totalAssignedHuman: number;
    availableBalanceHuman: number;
  };
}

type BrowserWallet = {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
};

export interface BuildUpdateSeatTxParams {
  connection: Connection;
  ownerPublicKey: PublicKey;
  vaultPublicKey: PublicKey;
  seatPublicKey: PublicKey;
  newLimit: number;
}

export async function buildUpdateSeatTransaction(
  params: BuildUpdateSeatTxParams
): Promise<UpdateSeatResult> {
  const {
    connection,
    ownerPublicKey,
    vaultPublicKey,
    seatPublicKey,
    newLimit,
  } = params;

  if (!Number.isInteger(newLimit) || newLimit <= 0) {
    throw new Error("Invalid newLimit. Must be a positive integer.");
  }

  const wallet: BrowserWallet = {
    publicKey: ownerPublicKey,
    signTransaction: async (transaction) => transaction,
    signAllTransactions: async (transactions) => transactions,
  };

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });

  const program = new Program<QuotaVault>(idl as QuotaVault, provider);

  // Fetch vault to validate against available balance
  let vault;
  try {
    vault = await program.account.vaultAccount.fetch(vaultPublicKey);
  } catch (error) {
    throw new Error(`Failed to fetch vault account: ${error}`);
  }

  let currentSeat;
  try {
    currentSeat = await program.account.seatAccount.fetch(seatPublicKey);
  } catch (error) {
    throw new Error(`Failed to fetch seat account: ${error}`);
  }

  // Convert base units to human units
  const totalDepositedBase = vault.totalDeposited.toNumber();
  const totalAssignedBase = vault.totalAssigned.toNumber();
  const totalDepositedHuman = totalDepositedBase / USDC_SCALE;
  const totalAssignedHuman = totalAssignedBase / USDC_SCALE;
  const availableBalanceHuman = totalDepositedHuman - totalAssignedHuman;
  const currentSeatLimitBase = currentSeat.limit.toNumber();
  const requiredAdditionalBalanceBase = Math.max(
    newLimit * USDC_SCALE - currentSeatLimitBase,
    0
  );
  const requiredAdditionalBalanceHuman = requiredAdditionalBalanceBase / USDC_SCALE;

  // Check only the delta that needs to be reserved for this seat.
  if (requiredAdditionalBalanceBase > totalDepositedBase - totalAssignedBase) {
    throw new Error(
      `Insufficient vault funds. This update needs ${formatUsdcAmount(requiredAdditionalBalanceHuman)} more USDC, but only ${formatUsdcAmount(availableBalanceHuman)} USDC is available.`
    );
  }

  const transaction = await program.methods
    .updateSeatHandler(new BN(newLimit).mul(new BN(1_000_000)))
    .accountsPartial({
      authority: ownerPublicKey,
      vault: vaultPublicKey,
      seat: seatPublicKey,
    })
    .transaction();

  return {
    transaction,
    vaultAllocation: {
      totalDepositedHuman,
      totalAssignedHuman,
      availableBalanceHuman,
    },
  };
}
