import { BN, AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import type { QuotaVault } from "../../types/quota_vault.ts";
import idl from "../../idl/quota_vault.json" with { type: "json" };

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
  monthlyLimit: number;
}

export async function buildCreateSeatTransaction(
  params: BuildCreateSeatTxParams
): Promise<Transaction> {
  const {
    connection,
    ownerPublicKey,
    vaultPublicKey,
    holderPublicKey,
    seatId,
    seatType,
    monthlyLimit,
  } = params;

  const wallet: BrowserWallet = {
    publicKey: ownerPublicKey,
    signTransaction: async (transaction) => transaction,
    signAllTransactions: async (transactions) => transactions,
  };

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });

  const program = new Program<QuotaVault>(idl as QuotaVault, provider);

  return program.methods
    .createSeat(
      holderPublicKey,
      new BN(seatId.toString()),
      seatType,
      new BN(monthlyLimit)
    )
    .accountsPartial({
      vault: vaultPublicKey,
      owner: ownerPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
}