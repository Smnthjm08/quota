import prisma from "../src/client.ts";
import { HttpMethod } from "../src/generated/prisma/client.ts";

async function main() {
  await prisma.routeConfig.upsert({
    where: {
      method_path: {
        method: HttpMethod.GET,
        path: "/api/echo",
      },
    },
    update: {},
    create: {
      path: "/api/echo",
      method: HttpMethod.GET,
      priceUsdc: "0.001",
      meterId: 1,
      credits: 1,
      freeQuota: 0,
      description: "Echo endpoint",
      active: true,
    },
  });

  await prisma.routeConfig.upsert({
    where: {
      method_path: {
        method: HttpMethod.GET,
        path: "/api/search",
      },
    },
    update: {},
    create: {
      path: "/api/search",
      method: HttpMethod.GET,
      priceUsdc: "0.001",
      meterId: 2,
      credits: 1,
      freeQuota: 0,
      description: "Search endpoint",
      active: true,
    },
  });

  await prisma.routeConfig.upsert({
    where: {
      method_path: {
        method: HttpMethod.POST,
        path: "/api/generate",
      },
    },
    update: {},
    create: {
      path: "/api/generate",
      method: HttpMethod.POST,
      priceUsdc: "0.01",
      meterId: 3,
      credits: 10,
      freeQuota: 0,
      description: "Generate endpoint",
      active: true,
    },
  });

  console.log("✅ Seeded route configs");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
