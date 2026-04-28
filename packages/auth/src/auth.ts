import { betterAuth, type Auth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins/custom-session";
import { prisma } from "@workspace/db";
import { sendEmail } from "./email.ts";

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const cookieDomain = process.env.BETTER_AUTH_COOKIE_DOMAIN?.trim();

const socialProviders = {
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
};

const authConfig: Parameters<typeof betterAuth>[0] = {
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  trustedOrigins: trustedOrigins && trustedOrigins.length > 0 ? trustedOrigins : undefined,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        template: "reset-password",
        to: user.email,
        variables: {
          resetLink: url,
          userEmail: user.email,
          userName: user.name,
          appName: "Quota",
          expirationMinutes: "60",
        },
      });
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const company = await prisma.company.findUnique({
        where: {
          ownerId: user.id,
        },
        select: {
          id: true,
          name: true,
          size: true,
          website: true,
          status: true,
          planId: true,
          vaultPda: true,
          ownerWalletPubkey: true,
          createdAt: true,
          updatedAt: true,
          plan: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        session,
        user,
        company,
      };
    }),
  ],
  advanced: cookieDomain
    ? {
        crossSubDomainCookies: {
          enabled: true,
          domain: cookieDomain,
        },
      }
    : undefined,
  socialProviders,
} satisfies Parameters<typeof betterAuth>[0];

export const auth: Auth<typeof authConfig> = betterAuth(authConfig);
