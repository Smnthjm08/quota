import { BN, AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type { QuotaVault } from "../../types/quota_vault.ts";
import idl from "../../idl/quota_vault.json" with { type: "json" };

// SPL Token Program ID (Mainnet)
const TOKEN_PROGRAM = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const ASSOCIATED_TOKEN_PROGRAM = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA9w2q"
);

const SYSTEM_PROGRAM = new PublicKey(
  "11111111111111111111111111111111"
);

type BrowserWallet = {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
};

export interface BuildTopupTxParams {
  connection: Connection;
  vaultOwnerPublicKey: PublicKey;
  vaultPublicKey: PublicKey;
  mintPublicKey: PublicKey;
  ownerTokenAccountPublicKey: PublicKey;
  vaultTokenAccountPublicKey: PublicKey;
  amount: number;
}

/**
 * Build a topup transaction where the vault owner can deposit from their own wallet
 * @param params - Transaction parameters including vault and token account details
 * @returns A Transaction object ready to be signed and sent
 */
export async function buildTopupTransaction(
  params: BuildTopupTxParams
): Promise<Transaction> {
  const {
    connection,
    vaultOwnerPublicKey,
    vaultPublicKey,
    mintPublicKey,
    ownerTokenAccountPublicKey,
    vaultTokenAccountPublicKey,
    amount,
  } = params;

  const wallet: BrowserWallet = {
    publicKey: vaultOwnerPublicKey,
    signTransaction: async (transaction) => transaction,
    signAllTransactions: async (transactions) => transactions,
  };

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });

  const program = new Program<QuotaVault>(idl as unknown as QuotaVault, provider);

  return program.methods
    .topupVault(new BN(amount))
    .accountsPartial({
      vault: vaultPublicKey,
      vaultOwner: vaultOwnerPublicKey,
      mint: mintPublicKey,
      ownerTokenAccount: ownerTokenAccountPublicKey,
      vaultTokenAccount: vaultTokenAccountPublicKey,
      tokenProgram: TOKEN_PROGRAM,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM,
      systemProgram: SYSTEM_PROGRAM,
    } as any)
    .transaction();
}

/**
 * Alternative: Execute topup instruction directly (for backend/API usage)
 * This version returns just the instruction rather than a full transaction
 */
export async function buildTopupInstruction(
  params: BuildTopupTxParams
): Promise<any> {
  const {
    connection,
    vaultOwnerPublicKey,
    vaultPublicKey,
    mintPublicKey,
    ownerTokenAccountPublicKey,
    vaultTokenAccountPublicKey,
    amount,
  } = params;

  const wallet: BrowserWallet = {
    publicKey: vaultOwnerPublicKey,
    signTransaction: async (transaction) => transaction,
    signAllTransactions: async (transactions) => transactions,
  };

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });

  const program = new Program<QuotaVault>(idl as unknown as QuotaVault, provider);

  return program.methods
    .topupVault(new BN(amount))
    .accountsPartial({
      vault: vaultPublicKey,
      vaultOwner: vaultOwnerPublicKey,
      mint: mintPublicKey,
      ownerTokenAccount: ownerTokenAccountPublicKey,
      vaultTokenAccount: vaultTokenAccountPublicKey,
      tokenProgram: TOKEN_PROGRAM,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM,
      systemProgram: SYSTEM_PROGRAM,
    } as any)
    .instruction();
}
