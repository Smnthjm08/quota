import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createClientProgram } from "../../provider.ts";

export interface BuildToggleSeatTxParams {
  connection: Connection;
  ownerPublicKey: PublicKey;
  vaultPublicKey: PublicKey;
  seatPublicKey: PublicKey;
}

export async function buildToggleSeatTransaction(
  params: BuildToggleSeatTxParams
): Promise<Transaction> {
  const { connection, ownerPublicKey, vaultPublicKey, seatPublicKey } = params;

  const program = createClientProgram(connection, ownerPublicKey);

  return program.methods
    .toggleSeatHandler()
    .accountsPartial({
      authority: ownerPublicKey,
      vault: vaultPublicKey,
      seat: seatPublicKey,
    })
    .transaction();
}