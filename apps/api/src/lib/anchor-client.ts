import { Keypair } from "@solana/web3.js";
import { createProgram, getConnection } from "@workspace/anchor-client";
import type { QuotaVault } from "@workspace/anchor-client";

import { Program } from "@coral-xyz/anchor";

function loadApiKeypair(): Keypair {
  const raw = process.env.API_SIGNER_PRIVATE_KEY;
  if (!raw) throw new Error("API_SIGNER_PRIVATE_KEY not set");

  try {
    const arr = JSON.parse(raw);
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  } catch {
    const bs58 = require("bs58");
    return Keypair.fromSecretKey(bs58.decode(raw));
  }
}

export const apiKeypair = loadApiKeypair();
export const connection = getConnection(process.env.SOLANA_RPC_URL!);
export const program: Program<QuotaVault> = createProgram(
  process.env.SOLANA_RPC_URL!,
  apiKeypair
);
