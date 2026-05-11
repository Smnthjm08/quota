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
  const bytes = new Uint8Array(8);
  let value = seatId;

  for (let i = 0; i < 8; i += 1) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }

  const buf = Buffer.from(bytes);
  return PublicKey.findProgramAddressSync(
    [SEAT_SEED, vaultPubkey.toBuffer(), buf],
    PROGRAM_ID
  );
}
