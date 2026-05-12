import { prisma } from "@workspace/db";

async function main() {
  const plans = await prisma.plan.findMany();
  console.log("Plans:", JSON.stringify(plans, null, 2));
}

main().catch(console.error);
