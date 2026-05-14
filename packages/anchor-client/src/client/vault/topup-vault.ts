import { BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createClientProgram } from "../../provider.ts";

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

  const program = createClientProgram(connection, vaultOwnerPublicKey);

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

  const program = createClientProgram(connection, vaultOwnerPublicKey);

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
