import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { deriveVaultPda } from "./pda.ts";
import type { QuotaVault } from "./types/quota_vault.ts";

export async function initializeVault(
  program: Program<QuotaVault>,
  owner: Keypair,
  apiSigner: PublicKey,
  plan: number
) {
  const [vaultPda] = deriveVaultPda(owner.publicKey);

  const tx = await program.methods
    .initializeVault(apiSigner, plan)
    .accounts({
      owner: owner.publicKey,
      //   vault: vaultPda,
      //   systemProgram: SystemProgram.programId,
    })
    .signers([owner])
    .rpc();

  return { tx, vaultPda };
}
