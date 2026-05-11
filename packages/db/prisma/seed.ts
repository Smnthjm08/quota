import prisma from "../src/client.ts";

async function main() {
  await prisma.plan.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      key: "free",
      name: "Free Plan (2 Seats)",
      priceCents: 0,
      dodoProductId: "free",
      currency: "USD",
      initDeposit: 1,
      maxAllowedSeats: 2,
      interval: "MONTH",
    },
    update: {
      key: "free",
      name: "Free Plan (2 Seats)",
      priceCents: 0,
      dodoProductId: "free",
      currency: "USD",
      initDeposit: 1,
      maxAllowedSeats: 2,
      interval: "MONTH",
    },
  });

  await prisma.plan.upsert({
    where: { id: 2 },
    create: {
      id: 2,
      key: "starter",
      name: "Starter Plan (5 Seats)",
      priceCents: 2000,
      dodoProductId: "pdt_0NeXaUtqArAMQa4XQbXXd",
      currency: "USD",
      initDeposit: 1,
      maxAllowedSeats: 5,
      interval: "MONTH",
    },
    update: {
      key: "starter",
      name: "Starter Plan (5 Seats)",
      priceCents: 2000,
      dodoProductId: "pdt_0NeXaUtqArAMQa4XQbXXd",
      currency: "USD",
      initDeposit: 1,
      maxAllowedSeats: 5,
      interval: "MONTH",
    },
  });

  await prisma.plan.upsert({
    where: { id: 3 },
    create: {
      id: 3,
      key: "team",
      name: "Team Plan (25 Seats)",
      priceCents: 5000,
      dodoProductId: "pdt_0NeXaDjc6LcXh4HZ8GKZW",
      currency: "USD",
      initDeposit: 2,
      maxAllowedSeats: 25,
      interval: "MONTH",
    },
    update: {
      key: "team",
      name: "Team Plan (25 Seats)",
      priceCents: 5000,
      dodoProductId: "pdt_0NeXaDjc6LcXh4HZ8GKZW",
      currency: "USD",
      initDeposit: 2,
      maxAllowedSeats: 25,
      interval: "MONTH",
    },
  });

  await prisma.plan.upsert({
    where: { id: 4 },
    create: {
      id: 4,
      key: "topup_10",
      name: "Vault Top-Up $10",
      priceCents: 1000,
      dodoProductId: "pdt_0NeXdPeuS4etQOuWeSl8A",
      currency: "USD",
      initDeposit: 0,
      interval: "ONETIME",
    },
    update: {
      name: "Vault Top-Up $10",
      priceCents: 1000,
      dodoProductId: "pdt_0NeXdPeuS4etQOuWeSl8A",
      currency: "USD",
      initDeposit: 0,
      interval: "ONETIME",
    },
  });

  await prisma.plan.upsert({
    where: { id: 5 },
    create: {
      id: 5,
      key: "topup_25",
      name: "Vault Top-Up $25",
      priceCents: 2500,
      dodoProductId: "pdt_0NeXdWSQSegnMKimhbjYl",
      currency: "USD",
      initDeposit: 0,
      interval: "ONETIME",
    },
    update: {
      name: "Vault Top-Up $25",
      priceCents: 2500,
      dodoProductId: "pdt_0NeXdWSQSegnMKimhbjYl",
      currency: "USD",
      initDeposit: 0,
      interval: "ONETIME",
    },
  });

  await prisma.plan.upsert({
    where: { id: 6 },
    create: {
      id: 6,
      key: "topup_50",
      name: "Vault Top-Up $50",
      priceCents: 5000,
      dodoProductId: "pdt_0NeXdbco1KSyc3bpGP5UY",
      initDeposit: 0,
      currency: "USD",
      interval: "ONETIME",
    },
    update: {
      name: "Vault Top-Up $50",
      priceCents: 5000,
      dodoProductId: "pdt_0NeXdbco1KSyc3bpGP5UY",
      currency: "USD",
      initDeposit: 0,
      interval: "ONETIME",
    },
  });

  console.log("✅ Seeded plan configs");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
