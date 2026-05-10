import { BN, AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type { QuotaVault } from "../../types/quota_vault.ts";
import idl from "../../idl/quota_vault.json" with { type: "json" };

// SPL Token Program ID (Mainnet)
const TOKEN_PROGRAM = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

type BrowserWallet = {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
};

export interface BuildDepositTxParams {
  connection: Connection;
  ownerPublicKey: PublicKey;
  vaultPublicKey: PublicKey;
  mintPublicKey: PublicKey;
  userTokenAccountPublicKey: PublicKey;
  vaultTokenAccountPublicKey: PublicKey;
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
