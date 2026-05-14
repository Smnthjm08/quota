import { useState } from "react";
import { useTopupVault } from "@/hooks/use-topup-vault";

interface TopupFormProps {
  vaultPublicKey: string;
  mintPublicKey: string;
  ownerTokenAccountPublicKey: string;
  vaultTokenAccountPublicKey: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
}

export function TopupVaultForm({
  vaultPublicKey,
  mintPublicKey,
  ownerTokenAccountPublicKey,
  vaultTokenAccountPublicKey,
  onSuccess,
  onError,
}: TopupFormProps) {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { topup, isLoading, error, isConnected } = useTopupVault({
    vaultPublicKey,
    mintPublicKey,
    ownerTokenAccountPublicKey,
    vaultTokenAccountPublicKey,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await topup(Number(amount));
      onSuccess?.(result.signature);
      setAmount(""); // Clear form
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      onError?.(error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="rounded border border-yellow-200 bg-yellow-50 p-4">
        Please connect your wallet to proceed
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium">
          Amount to Top Up
        </label>
        <input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading || isSubmitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || isSubmitting || !amount}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading || isSubmitting ? "Processing..." : "Top Up Vault"}
      </button>
    </form>
  );
}
