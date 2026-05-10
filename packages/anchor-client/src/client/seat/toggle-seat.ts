import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type { QuotaVault } from "../../types/quota_vault.ts";
import idl from "../../idl/quota_vault.json" with { type: "json" };

type BrowserWallet = {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
};

export interface BuildToggleSeatTxParams {
  connection: Connection;
  ownerPublicKey: PublicKey;
  vaultPublicKey: PublicKey;
  seatPublicKey: PublicKey;
}

export async function buildToggleSeatTransaction(
  params: BuildToggleSeatTxParams
): Promise<Transaction> {
  const { connection, ownerPublicKey, vaultPublicKey, seatPublicKey } = params;

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
    .toggleSeatHandler()
    .accountsPartial({
      authority: ownerPublicKey,
      vault: vaultPublicKey,
      seat: seatPublicKey,
    })
    .transaction();
}