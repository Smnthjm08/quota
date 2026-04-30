import express from "express";
import helmet from "helmet";
import cors from "cors";
import { prisma } from "@workspace/db";
import authMiddleware from "./auth.middleware.ts";
import companyMiddleware from "./company.middleware.ts";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import {
  dodoApiKey,
  dodoClient,
  maskedDodoApiKey,
  mode,
} from "./dodo-client.ts";
import { dodoWebhooksHandler } from "./weebhook.ts";

export { dodoApiKey, dodoClient, mode } from "./dodo-client.ts";

console.info(
  `DodoPayments init — environment=${mode}, token=${maskedDodoApiKey}, tokenLength=${dodoApiKey.length}`
);

const app: express.Express = express();
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const frontendUrl =
  process.env.NEXT_PUBLIC_WEB_URL ??
  process.env.APP_URL ??
  "http://localhost:3000";

app.post(
  "/api/v1/webhooks/dodo",
  express.raw({ type: "application/json" }),
  dodoWebhooksHandler
);

// Basic middleware
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", authMiddleware, (req, res) => {
  res.send("Hello, World!");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/v1/onboarding/company", authMiddleware, async (req, res) => {
  try {
    const { name, size, website, address, state, city, pin_code } = req.body;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const company = await prisma.company.upsert({
      where: {
        ownerId,
      },
      create: {
        name,
        size,
        website,
        address,
        state,
        city,
        pinCode: pin_code,
        status: "PENDING",
        owner: {
          connect: {
            id: ownerId,
          },
        },
      },
      update: {
        name,
        size,
        website,
        address,
        state,
        city,
        pinCode: pin_code,
        status: "PENDING",
      },
    });

    res.status(201).json({
      message: "Company registered successfully",
      data: company,
      error: null,
    });
  } catch (error) {
    console.log("Error during company onboarding:", error);
    res.status(500).json({ error: "Failed to onboard company" });
  }
});

app.post(
  "/api/v1/onboarding/plan",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const planId = Number(req.body?.planId);

      if (!Number.isInteger(planId)) {
        return res.status(400).json({ message: "A valid planId is required" });
      }

      const plan = await prisma.plan.findUnique({
        where: {
          id: planId,
        },
      });

      if (!plan) {
        return res.status(400).json({ message: "Plan does not exist" });
      }

      if (!req.company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      const user = req.user;

      if (!user?.id || !user.email || !user.name) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const trialPeriodDays = Number(process.env.DODO_TRIAL_PERIOD_DAYS ?? 0);

      const checkout = await dodoClient.checkoutSessions.create({
        product_cart: [{ product_id: plan.dodoProductId, quantity: 1 }],
        ...(trialPeriodDays > 0
          ? { subscription_data: { trial_period_days: trialPeriodDays } }
          : {}),
        customer: {
          email: user.email,
          name: user.name,
        },
        metadata: {
          companyId: req.company.id,
          ownerId: user.id,
          planId: String(plan.id),
          planKey: plan.key,
        },
        return_url: `${frontendUrl}/onboarding/plan/success`,
      });

      res.status(200).json({
        message: "Payment Checkout Session Created",
        data: checkout,
        error: null,
      });

      // const subscription: SubscriptionCreateInput = prisma.subscription.create({
      //   data: {
      //     plan: {
      //       connect: {
      //         id: plan.id,
      //       },
      //     },
      //     company: {
      //       connect: {
      //         id: req.company?.id,
      //       },
      //     },
      //     status: "INCOMPLETE",
      //   },
      // });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create Dodo checkout session" });
    }
  }
);

app.post(
  "/api/auth/wallet/verify",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const { wallet, nonce, signature } = req.body as {
        wallet?: string;
        nonce?: string;
        signature?: number[];
      };

      if (!wallet || !nonce || !signature) {
        return res
          .status(400)
          .json({ message: "wallet, nonce and signature are required" });
      }

      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Ensure user has a company (companyMiddleware attaches it or null)
      const company = req.company;
      if (!company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      // Recreate the message the client signed
      const messageString = `Verify wallet ownership for Quota\nNonce:${nonce}`;
      const message = new TextEncoder().encode(messageString);

      // Convert signature array back to Uint8Array
      const signatureUint8 = new Uint8Array(signature);

      // Verify signature using the public key bytes
      let pubkeyBytes: Uint8Array;
      try {
        pubkeyBytes = new PublicKey(wallet).toBytes();
      } catch (e) {
        return res.status(400).json({ message: "Invalid wallet public key" });
      }

      const isValid = nacl.sign.detached.verify(
        message,
        signatureUint8,
        pubkeyBytes
      );

      if (!isValid) {
        return res
          .status(401)
          .json({ message: "Signature verification failed" });
      }

      // Persist the wallet public key on the company record for better UX
      const updated = await prisma.company.update({
        where: { id: company.id },
        data: { ownerWalletPubkey: wallet },
      });

      return res
        .status(200)
        .json({ message: "Wallet verified", data: { company: updated } });
    } catch (error) {
      console.error("Wallet verify error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Return wallet status for the authenticated user's company
app.get(
  "/api/auth/wallet/status",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const company = req.company;
      if (!company) {
        return res.status(200).json({ verified: false, wallet: null });
      }

      return res.status(200).json({
        verified: !!company.ownerWalletPubkey,
        wallet: company.ownerWalletPubkey ?? null,
      });
    } catch (error) {
      console.error("Wallet status error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get("/api/v1/onboarding/plan", authMiddleware, async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: [{ priceCents: "asc" }, { id: "asc" }],
    });
    return res.status(200).json({
      message: "Pricing plans fetched successfully",
      data: plans,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create Dodo checkout session" });
  }
});

// async function checkout() {
//   const productId = process.env.DODO_TEAM_PRODUCT_ID;

//   if (!productId) {
//     throw new Error("Missing DODO_TEAM_PRODUCT_ID in environment");
//   }

//   const session = await dodoClient.checkoutSessions.create({
//     product_cart: [{ product_id: productId, quantity: 1 }],
//     allowed_payment_method_types: ["crypto_currency"],
//     // Optional: configure trials for subscription products
//     subscription_data: { trial_period_days: 0 },
//     customer: {
//       email: "sub@example.com",
//       name: "Jane Doe",
//     },
//     return_url: "https://localhost:3000/success",
//   });

//   console.log(session.checkout_url);
//   return session.checkout_url;
// }

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

const PORT = Number(process.env.API_PORT || process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
