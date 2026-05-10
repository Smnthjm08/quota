import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { buildTopupTransaction } from '@quota/anchor-client';

interface UseTopupVaultParams {
  vaultPublicKey: string;
  mintPublicKey: string;
  ownerTokenAccountPublicKey: string;
  vaultTokenAccountPublicKey: string;
}

export function useTopupVault(params: UseTopupVaultParams) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topup = useCallback(
    async (amount: number) => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);
      setError(null);

      try {
        // Build the transaction
        const tx = await buildTopupTransaction({
          connection,
          vaultOwnerPublicKey: publicKey,
          vaultPublicKey: new PublicKey(params.vaultPublicKey),
          mintPublicKey: new PublicKey(params.mintPublicKey),
          ownerTokenAccountPublicKey: new PublicKey(params.ownerTokenAccountPublicKey),
          vaultTokenAccountPublicKey: new PublicKey(params.vaultTokenAccountPublicKey),
          amount,
        });

        // Send and confirm transaction
        const signature = await sendTransaction(tx, connection, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(
          signature,
          'confirmed'
        );

        if (confirmation.value.err) {
          throw new Error('Transaction failed');
        }

        return {
          success: true,
          signature,
          message: `Successfully topped up ${amount} tokens`,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
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
