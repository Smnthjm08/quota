import prisma from "../src/client.ts";

async function main() {
  console.log("✅ Seeded plans configs");
}

main()
  .then(async () => {
    await prisma.plan.upsert({
      where: {
        id: 1,
      },
      create: {
        key: "starter",
        name: "Starter Plan (5 Seats)",
        priceCents: 2000,
        dodoProductId: "pdt_0NdcQXppEKO8pjDZ4iVSn",
        currency: "USD",
        interval: "month",
      },
      update: {
        key: "starter",
        name: "Starter Plan (5 Seats)",
        priceCents: 2000,
        dodoProductId: "pdt_0NdcQXppEKO8pjDZ4iVSn",
        currency: "USD",
        interval: "month",
      },
    });

    await prisma.plan.upsert({
      where: {
        id: 2,
      },
      create: {
        id: 2,
        key: "team",
        name: "Team Plan (25 Seats)",
        priceCents: 5000,
        dodoProductId: "pdt_0NdcQqsBfx0PY1reFJYjl",
        currency: "USD",
        interval: "month",
      },
      update: {
        id: 2,
        key: "team",
        name: "Team Plan (25 Seats)",
        priceCents: 5000,
        dodoProductId: "pdt_0NdcQqsBfx0PY1reFJYjl",
        currency: "USD",
        interval: "month",
      },
    });

    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
