import { BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createClientProgram } from "../../provider.ts";

export interface BuildConsumeTxParams {
  connection: Connection;
  apiSignerPublicKey: PublicKey;
  vaultPublicKey: PublicKey;
  seatPublicKey: PublicKey;
  // `amount` is expected in base token units (for USDC use 1 USDC = 1_000_000 units)
  amount: number;
}

export async function buildConsumeTransaction(
  params: BuildConsumeTxParams
): Promise<Transaction> {
  const {
    connection,
    apiSignerPublicKey,
    vaultPublicKey,
    seatPublicKey,
    amount,
  } = params;

  const program = createClientProgram(connection, apiSignerPublicKey);

  return program.methods
    .consume(new BN(amount))
    .accountsPartial({
      authority: apiSignerPublicKey,
      vault: vaultPublicKey,
      seat: seatPublicKey,
    })
    .transaction();
}
