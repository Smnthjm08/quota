import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { buildTopupTransaction } from "@workspace/anchor-client";

interface UseTopupVaultParams {
  vaultPublicKey: string;
  mintPublicKey: string;
  ownerTokenAccountPublicKey: string;
  vaultTokenAccountPublicKey: string;
}

export function useTopupVault(params: UseTopupVaultParams) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topup = useCallback(
    async (amount: number) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const vaultPublicKey = new PublicKey(params.vaultPublicKey);
        const mintPublicKey = new PublicKey(params.mintPublicKey);
        const ownerTokenAccountPublicKey = new PublicKey(
          params.ownerTokenAccountPublicKey
        );
        const vaultTokenAccountPublicKey = new PublicKey(
          params.vaultTokenAccountPublicKey
        );

        const setupInstructions = [];

        const ownerTokenAccountInfo = await connection.getAccountInfo(
          ownerTokenAccountPublicKey
        );
        if (!ownerTokenAccountInfo) {
          setupInstructions.push(
            createAssociatedTokenAccountInstruction(
              publicKey,
              ownerTokenAccountPublicKey,
              publicKey,
              mintPublicKey,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }

        const vaultTokenAccountInfo = await connection.getAccountInfo(
          vaultTokenAccountPublicKey
        );
        if (!vaultTokenAccountInfo) {
          setupInstructions.push(
            createAssociatedTokenAccountInstruction(
              publicKey,
              vaultTokenAccountPublicKey,
              vaultPublicKey,
              mintPublicKey,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }

        // Build the transaction
        const tx = await buildTopupTransaction({
          connection,
          vaultOwnerPublicKey: publicKey,
          vaultPublicKey,
          mintPublicKey,
          ownerTokenAccountPublicKey,
          vaultTokenAccountPublicKey,
          amount,
        });

        if (setupInstructions.length > 0) {
          tx.instructions.unshift(...setupInstructions);
        }

        // Send and confirm transaction
        const signature = await sendTransaction(tx, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(
          signature,
          "confirmed"
        );

        if (confirmation.value.err) {
          throw new Error("Transaction failed");
        }

        return {
          success: true,
          signature,
          message: `Successfully topped up ${amount} tokens`,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, connection, sendTransaction, params]
  );

  return {
    topup,
    isLoading,
    error,
    isConnected: !!publicKey,
  };
}
