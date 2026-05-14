import {
  PublicKey,
  SystemProgram,
  Keypair,
  Connection,
  Transaction,
} from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { deriveVaultPda } from "../../pda.ts";
import type { QuotaVault } from "../../types/quota_vault.ts";
import { createClientProgram } from "../../provider.ts";

export interface BuildVaultTxParams {
  connection: Connection;
  ownerPublicKey: PublicKey;
  apiSignerPublicKey: PublicKey;
  planId: number;
}


export async function initializeVault(
  program: Program<QuotaVault>,
  owner: Keypair,
  apiSigner: PublicKey,
  plan: number
) {
  const [vaultPda] = deriveVaultPda(owner.publicKey);

  const tx = await program.methods
    .initializeVault(apiSigner, plan)
    .accountsPartial({
      owner: owner.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([owner])
    .rpc();

  return { tx, vaultPda };
}


export async function buildInitializeVaultTransaction(
  params: BuildVaultTxParams
): Promise<Transaction> {
  const { connection, ownerPublicKey, apiSignerPublicKey, planId } = params;

  const [vaultPda] = deriveVaultPda(ownerPublicKey);

  const program = createClientProgram(connection, ownerPublicKey);

  return program.methods
    .initializeVault(apiSignerPublicKey, planId)
    .accountsPartial({
      vault: vaultPda,
      owner: ownerPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
}
