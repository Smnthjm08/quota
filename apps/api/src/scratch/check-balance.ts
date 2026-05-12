import { PublicKey } from "@solana/web3.js";
import { prisma } from "@workspace/db";
import { connection } from "../lib/anchor-client";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const DEFAULT_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDC_MINT = new PublicKey(process.env.USDC_MINT ?? DEFAULT_USDC_MINT);

function deriveAssociatedTokenAddress(
  owner: PublicKey,
  mint: PublicKey
): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

async function main() {
  const companyId = "cmp1uot1600007ry48td3gqyf";
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!company) {
    console.log("Company not found");
    return;
  }

  console.log("Company:", company.name);
  console.log("Vault PDA:", company.vaultPda);

  if (company.vaultPda) {
    const vaultTokenAccount = deriveAssociatedTokenAddress(
      new PublicKey(company.vaultPda),
      USDC_MINT
    );
    try {
      const balance =
        await connection.getTokenAccountBalance(vaultTokenAccount);
      console.log("Vault Balance:", balance.value.uiAmount);
    } catch (e) {
      console.log("Vault Balance: 0 (Account might not exist)");
    }
  } else {
    console.log("Vault not initialized");
  }
}

main().catch(console.error);
