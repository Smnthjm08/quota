import { PublicKey } from "@solana/web3.js";
import { program, apiKeypair } from "../lib/anchor-client.ts";
import { deriveVaultPda, deriveSeatPda } from "@workspace/anchor-client";
import { BN } from "@coral-xyz/anchor";

export async function consumeOnChain(
  ownerPubkey: string,
  seatPdaString: string,
  credits: number
): Promise<{ success: boolean; txSig?: string; error?: string }> {
  try {
    const owner = new PublicKey(ownerPubkey);
    const [vaultPda] = deriveVaultPda(owner);
    const seatPda = new PublicKey(seatPdaString);

    const txSig = await program.methods
      .consume(new BN(credits))
      .accountsPartial({
        authority: apiKeypair.publicKey,
        vault: vaultPda,
        seat: seatPda,
      })
      .signers([apiKeypair])
      .rpc({ commitment: "confirmed" });

    return { success: true, txSig };
  } catch (err: any) {
    const msg = err.message ?? "";

    if (msg.includes("QuotaExceeded")) return { success: false, error: "quota_exceeded" };
    if (msg.includes("SeatInactive")) return { success: false, error: "seat_inactive" };
    if (msg.includes("VaultInactive")) return { success: false, error: "vault_inactive" };
    if (msg.includes("MathOverflow")) return { success: false, error: "math_overflow" };
    if (msg.includes("Unauthorized")) return { success: false, error: "unauthorized" };

    console.error("consume error:", msg);
    return { success: false, error: "consume_failed" };
  }
}
