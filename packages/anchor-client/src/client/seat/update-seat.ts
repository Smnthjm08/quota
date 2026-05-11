import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type { QuotaVault } from "../../types/quota_vault.ts";
import idl from "../../idl/quota_vault.json" with { type: "json" };

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

  // Convert base units to human units
  const totalDepositedHuman = vault.totalDeposited.toNumber() / 1_000_000;
  const totalAssignedHuman = vault.totalAssigned.toNumber() / 1_000_000;
  const availableBalanceHuman = totalDepositedHuman - totalAssignedHuman;

  // Check if new limit exceeds available balance (conservative check)
  if (newLimit > totalDepositedHuman) {
    throw new Error(
      `New limit (${newLimit} USDC) exceeds total vault balance (${totalDepositedHuman} USDC).`
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
