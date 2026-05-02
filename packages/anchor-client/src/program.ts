import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import type { QuotaVault } from "./types/quota_vault.ts";
import idl from "./idl/quota_vault.json" with { type: "json" };

export const PROGRAM_ID = new PublicKey(
  "HZ9sQe6snr7g1FrnKftH6xijKWCx3JdJF9XRy1JQuHGC"
);

export const VAULT_SEED = Buffer.from("vault");
export const SEAT_SEED = Buffer.from("seat");

export function createProgram(
  rpcUrl: string,
  signer: Keypair
): Program<QuotaVault> {
  const connection = new Connection(rpcUrl, "confirmed");
  const wallet = new Wallet(signer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<QuotaVault>(idl as QuotaVault, provider);
}

export function getConnection(rpcUrl: string): Connection {
  return new Connection(rpcUrl, "confirmed");
}
