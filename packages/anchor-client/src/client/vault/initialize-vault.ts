import {
  PublicKey,
  SystemProgram,
  Keypair,
  Connection,
  Transaction,
} from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { deriveVaultPda } from "../../pda.ts";
import type { QuotaVault } from "../../types/quota_vault.ts";
import idl from "../../idl/quota_vault.json" with { type: "json" };

type BrowserWallet = {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
};

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
    .initializeVault(apiSignerPublicKey, planId)
    .accountsPartial({
      vault: vaultPda,
      owner: ownerPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
}
