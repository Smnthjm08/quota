import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type { QuotaVault } from "./types/quota_vault.ts";
import idl from "./idl/quota_vault.json" with { type: "json" };

/**
 * Minimal wallet interface matching what Anchor expects for
 * transaction-building (no real signing needed).
 */
export type BrowserWallet = {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
};

/**
 * Create a stub BrowserWallet for transaction building.
 * The wallet never actually signs — it just passes transactions through.
 */
export function createBrowserWallet(publicKey: PublicKey): BrowserWallet {
  return {
    publicKey,
    signTransaction: async (transaction) => transaction,
    signAllTransactions: async (transactions) => transactions,
  };
}

/**
 * Create an AnchorProvider + Program pair from a Connection and a public key.
 * Use this in all client-side transaction builders to avoid duplicating
 * the provider/program boilerplate.
 */
export function createClientProgram(
  connection: Connection,
  publicKey: PublicKey
): Program<QuotaVault> {
  const wallet = createBrowserWallet(publicKey);
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  return new Program<QuotaVault>(idl as unknown as Idl, provider);
}
