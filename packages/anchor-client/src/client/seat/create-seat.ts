import { BN, AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import type { QuotaVault } from "../../types/quota_vault.ts";
import idl from "../../idl/quota_vault.json" with { type: "json" };
import { deriveSeatPda } from "../../pda.ts";

type BrowserWallet = {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
};

export interface BuildCreateSeatTxParams {
  connection: Connection;
  ownerPublicKey: PublicKey;
  vaultPublicKey: PublicKey;
  holderPublicKey: PublicKey;
  seatId: bigint;
  seatType: number;
  monthlyLimit: number; // in human units (USDC)
}

export interface VaultAllocationInfo {
  totalDepositedHuman: number; // in human units (USDC)
  totalAssignedHuman: number; // in human units (USDC)
  availableBalanceHuman: number; // in human units (USDC)
}

export interface CreateSeatResult {
  transaction: Transaction;
  vaultAllocation: VaultAllocationInfo;
}

export async function buildCreateSeatTransaction(
  params: BuildCreateSeatTxParams
): Promise<CreateSeatResult> {
  const {
    connection,
    ownerPublicKey,
    vaultPublicKey,
    holderPublicKey,
    seatId,
    seatType,
    monthlyLimit,
  } = params;

  if (!Number.isInteger(seatType) || (seatType !== 1 && seatType !== 2)) {
    throw new Error("Invalid seatType. Expected 1 (HUMAN) or 2 (AGENT).");
  }

  if (!Number.isInteger(monthlyLimit) || monthlyLimit <= 0) {
    throw new Error("Invalid monthlyLimit. Must be a positive integer.");
  }

  const [seatPublicKey] = deriveSeatPda(vaultPublicKey, seatId);

  const wallet: BrowserWallet = {
    publicKey: ownerPublicKey,
    signTransaction: async (transaction) => transaction,
    signAllTransactions: async (transactions) => transactions,
  };

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });

  const program = new Program<QuotaVault>(idl as QuotaVault, provider);

  // Fetch vault to check balance and show allocation info
  let vault;
  try {
    vault = await program.account.vaultAccount.fetch(vaultPublicKey);
  } catch (error) {
    throw new Error(`Failed to fetch vault account: ${error}`);
  }

  // Convert base units to human units (USDC: 6 decimals)
  const totalDepositedHuman = vault.totalDeposited.toNumber() / 1_000_000;
  const totalAssignedHuman = vault.totalAssigned.toNumber() / 1_000_000;
  const availableBalanceHuman = totalDepositedHuman - totalAssignedHuman;

  // Check if seat limit exceeds available balance
  if (monthlyLimit > availableBalanceHuman) {
    throw new Error(
      `Seat limit (${monthlyLimit} USDC) exceeds available vault balance (${availableBalanceHuman} USDC). ` +
      `Total deposited: ${totalDepositedHuman} USDC, already allocated: ${totalAssignedHuman} USDC.`
    );
  }

  const transaction = await program.methods
    .createSeat(
      holderPublicKey,
      new BN(seatId.toString()),
      seatType,
      // store limits on-chain in base units (USDC: 1 USDC = 1_000_000 base units)
      new BN(monthlyLimit).mul(new BN(1_000_000))
    )
    .accountsPartial({
      seat: seatPublicKey,
      vault: vaultPublicKey,
      owner: ownerPublicKey,
      systemProgram: SystemProgram.programId,
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