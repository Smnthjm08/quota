import { BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createClientProgram } from "../../provider.ts";

// SPL Token Program ID (Mainnet)
const TOKEN_PROGRAM = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export interface BuildDepositTxParams {
  connection: Connection;
  ownerPublicKey: PublicKey;
  vaultPublicKey: PublicKey;
  mintPublicKey: PublicKey;
  userTokenAccountPublicKey: PublicKey;
  vaultTokenAccountPublicKey: PublicKey;
  // `amount` is expected in base token units (for USDC use 1 USDC = 1_000_000 units)
  amount: number;
}

export async function buildDepositTransaction(
  params: BuildDepositTxParams
): Promise<Transaction> {
  const {
    connection,
    ownerPublicKey,
    vaultPublicKey,
    mintPublicKey,
    userTokenAccountPublicKey,
    vaultTokenAccountPublicKey,
    amount,
  } = params;

  const program = createClientProgram(connection, ownerPublicKey);

  return program.methods
    .depositToVault(new BN(amount))
    .accountsPartial({
      vault: vaultPublicKey,
      authority: ownerPublicKey,
      mint: mintPublicKey,
      fromTokenAccount: userTokenAccountPublicKey,
      vaultTokenAccount: vaultTokenAccountPublicKey,
      tokenProgram: TOKEN_PROGRAM,
    })
    .transaction();
}
