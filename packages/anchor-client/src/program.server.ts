import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, type Idl } from "@coral-xyz/anchor";
import type { QuotaVault } from "./types/quota_vault.ts";
import idl from "./idl/quota_vault.json" with { type: "json" };

export function createProgram(
  rpcUrl: string,
  signer: Keypair
): Program<QuotaVault> {
  const connection = new Connection(rpcUrl, "confirmed");
  const wallet = new Wallet(signer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<QuotaVault>(idl as unknown as Idl, provider);
}

export function getConnection(rpcUrl: string): Connection {
  return new Connection(rpcUrl, "confirmed");
}
