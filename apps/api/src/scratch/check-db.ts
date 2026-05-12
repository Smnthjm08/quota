import { prisma } from "@workspace/db";

async function main() {
  const plans = await prisma.plan.findMany();
  console.log("Plans:", JSON.stringify(plans, null, 2));

  const topups = await prisma.vaultTopUp.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  console.log("Topups:", JSON.stringify(topups, null, 2));

  const events = await prisma.dodoWebhookEvent.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  console.log("Events:", JSON.stringify(events, null, 2));
}

main().catch(console.error);
