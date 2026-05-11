import { BN, AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type { QuotaVault } from "../../types/quota_vault.ts";
import idl from "../../idl/quota_vault.json" with { type: "json" };

type BrowserWallet = {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
};

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

  // The wallet object is a mock since we just need to build the transaction.
  // The actual signing will likely be done by the backend api_signer.
  const wallet: BrowserWallet = {
    publicKey: apiSignerPublicKey,
    signTransaction: async (transaction) => transaction,
    signAllTransactions: async (transactions) => transactions,
  };

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });

  const program = new Program<QuotaVault>(idl as QuotaVault, provider);

  return program.methods
    .consume(new BN(amount))
    .accountsPartial({
      authority: apiSignerPublicKey,
      vault: vaultPublicKey,
      seat: seatPublicKey,
    })
    .transaction();
}
