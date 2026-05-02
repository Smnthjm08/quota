import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, VAULT_SEED, SEAT_SEED } from "./program.ts";

export function deriveVaultPda(ownerPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, ownerPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveSeatPda(
  vaultPubkey: PublicKey,
  seatId: bigint
): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(seatId);
  return PublicKey.findProgramAddressSync(
    [SEAT_SEED, vaultPubkey.toBuffer(), buf],
    PROGRAM_ID
  );
}
