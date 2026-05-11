// "use client";

// import { useState } from "react";
// import { AxiosError } from "axios";
// import { toast } from "sonner";
// import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// import { PublicKey } from "@solana/web3.js";
// import {
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   TOKEN_PROGRAM_ID,
//   createAssociatedTokenAccountInstruction,
//   getAssociatedTokenAddressSync,
// } from "@solana/spl-token";
// import {
//   buildWithdrawTransaction,
//   deriveVaultPda,
// } from "@workspace/anchor-client";
// import { axiosInstance } from "@/lib/axios";
// import { USDC_MINT } from "@/lib/mints";
// import { useVault } from "@/hooks/use-vault";
// import { Button } from "@workspace/ui/components/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@workspace/ui/components/dialog";
// import { Separator } from "@workspace/ui/components/separator";

// type WithdrawDialogProps = {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onWithdrawn?: () => Promise<void> | void;
// };

// export function WithdrawDialog({
//   open,
//   onOpenChange,
//   onWithdrawn,
// }: WithdrawDialogProps) {
//   const { connection } = useConnection();
//   const { publicKey, signTransaction } = useWallet();
//   const { vaultData, getVaultTokenAccount, reloadVaultData } = useVault();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);

//   const reset = () => setErrorMessage(null);

//   const handleOpenChange = (nextOpen: boolean) => {
//     if (!nextOpen && !isSubmitting) {
//       reset();
//     }
//     onOpenChange(nextOpen);
//   };

//   const getErrorMessage = (error: unknown, fallback: string) => {
//     if (typeof error === "object" && error !== null) {
//       const axiosError = error as AxiosError<{
//         message?: string;
//         error?: string;
//       }>;

//       return (
//         axiosError.response?.data?.message ??
//         axiosError.response?.data?.error ??
//         axiosError.message ??
//         fallback
//       );
//     }

//     return fallback;
//   };

//   const handleWithdrawAll = async () => {
//     setErrorMessage(null);

//     if (!publicKey) {
//       setErrorMessage("Connect your wallet to withdraw funds.");
//       return;
//     }

//     if (!signTransaction) {
//       setErrorMessage("This wallet does not support transaction signing.");
//       return;
//     }

//     try {
//       setIsSubmitting(true);

//       const [vaultPda] = deriveVaultPda(publicKey);
//       const vaultTokenAccount = getVaultTokenAccount(vaultPda);

//       if (!vaultTokenAccount) {
//         throw new Error("Could not derive vault token account.");
//       }

//       const vaultTokenAccountInfo =
//         await connection.getAccountInfo(vaultTokenAccount);

//       if (!vaultTokenAccountInfo) {
//         throw new Error("Vault token account does not exist yet.");
//       }

//       const balance =
//         await connection.getTokenAccountBalance(vaultTokenAccount);
//       const amount = BigInt(balance.value.amount);

//       if (amount <= 0n) {
//         setErrorMessage("Vault balance is already zero.");
//         return;
//       }

//       const ownerTokenAccount = getAssociatedTokenAddressSync(
//         USDC_MINT,
//         publicKey,
//         false
//       );

//       const ownerTokenAccountInfo =
//         await connection.getAccountInfo(ownerTokenAccount);

//       const txInstructions = [];
//       if (!ownerTokenAccountInfo) {
//         txInstructions.push(
//           createAssociatedTokenAccountInstruction(
//             publicKey,
//             ownerTokenAccount,
//             publicKey,
//             USDC_MINT,
//             TOKEN_PROGRAM_ID,
//             ASSOCIATED_TOKEN_PROGRAM_ID
//           )
//         );
//       }

//       const tx = await buildWithdrawTransaction({
//         connection,
//         ownerPublicKey: publicKey,
//         vaultPublicKey: vaultPda,
//         vaultTokenAccountPublicKey: vaultTokenAccount,
//         ownerTokenAccountPublicKey: ownerTokenAccount,
//         amount,
//       });

//       if (txInstructions.length > 0) {
//         tx.instructions.unshift(...txInstructions);
//       }

//       tx.feePayer = publicKey;
//       const { blockhash, lastValidBlockHeight } =
//         await connection.getLatestBlockhash("confirmed");
//       tx.recentBlockhash = blockhash;

//       const signedTx = await signTransaction(tx);
//       const txSignature = await connection.sendRawTransaction(
//         signedTx.serialize(),
//         { skipPreflight: true }
//       );

//       toast.loading("Confirming withdraw on-chain...");

//       await connection.confirmTransaction({
//         signature: txSignature,
//         blockhash,
//         lastValidBlockHeight,
//       });

//       toast.dismiss();

//       await axiosInstance.post("/api/v1/vault/withdraw", {
//         amount: balance.value.uiAmount ?? Number(amount) / 1_000_000,
//         txSignature,
//       });

//       toast.success("Vault funds withdrawn to your wallet");
//       reloadVaultData();
//       await onWithdrawn?.();
//       onOpenChange(false);
//     } catch (error) {
//       toast.dismiss();
//       setErrorMessage(
//         getErrorMessage(error, "We could not withdraw those funds right now.")
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const uiBalance = vaultData?.totalDeposited ?? 0;

//   return (
//     <Dialog open={open} onOpenChange={handleOpenChange}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>Withdraw All Funds</DialogTitle>
//           <DialogDescription>
//             Move the full vault balance back to your connected wallet.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
//           Current vault balance: {uiBalance.toFixed(2)} USDC
//         </div>

//         {errorMessage && (
//           <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
//             {errorMessage}
//           </div>
//         )}

//         <Separator />

//         <DialogFooter>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => handleOpenChange(false)}
//             disabled={isSubmitting}
//           >
//             Cancel
//           </Button>
//           <Button onClick={handleWithdrawAll} disabled={isSubmitting}>
//             {isSubmitting ? "Withdrawing..." : "Withdraw All"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
