import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createClientProgram } from "../../provider.ts";

export interface BuildCloseVaultTxParams {
  connection: Connection;
  ownerPublicKey: PublicKey;
  vaultPublicKey: PublicKey;
}

export async function buildCloseVaultTransaction(
  params: BuildCloseVaultTxParams
): Promise<Transaction> {
  const { connection, ownerPublicKey, vaultPublicKey } = params;

  const program = createClientProgram(connection, ownerPublicKey);

  return program.methods
    .closeVault()
    .accountsPartial({
      owner: ownerPublicKey,
      vault: vaultPublicKey,
    })
    .transaction();
}
