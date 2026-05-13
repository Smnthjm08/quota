import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: "../../.env", override: false });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Prisma config");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
