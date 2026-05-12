import { prisma } from "@workspace/db";

async function main() {
  const topups = await prisma.vaultTopUp.findMany();
  console.log("Topups:", JSON.stringify(topups, null, 2));
}

main().catch(console.error);
