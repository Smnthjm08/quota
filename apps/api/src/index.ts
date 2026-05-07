import express from "express";
import helmet from "helmet";
import cors from "cors";
import { randomBytes } from "crypto";
import { prisma } from "@workspace/db";
import companyMiddleware from "./middlewares/company.middleware.ts";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import {
  deriveSeatPda,
  deriveVaultPda,
  PROGRAM_ID,
} from "@workspace/anchor-client";
import { apiSignerPublicKey, connection } from "./lib/anchor-client.ts";
import {
  dodoApiKey,
  dodoClient,
  maskedDodoApiKey,
  mode,
} from "./lib/dodo-client.ts";
import { dodoWebhooksHandler } from "./dodo-weebhook.ts";
import authMiddleware from "./middlewares/auth.middleware.ts";

const DEFAULT_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDC_MINT = new PublicKey(process.env.USDC_MINT ?? DEFAULT_USDC_MINT);
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

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

export { dodoApiKey, dodoClient, mode } from "./lib/dodo-client.ts";

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

const WALLET_CHALLENGE_TTL_MS = 5 * 60 * 1000;

type WalletChallenge = {
  nonce: string;
  message: string;
  expiresAt: number;
};

const walletChallenges = new Map<string, WalletChallenge>();

function getChallengeKey(userId: string, wallet: string): string {
  return `${userId}:${wallet}`;
}

function pruneExpiredChallenges() {
  const now = Date.now();
  for (const [key, value] of walletChallenges.entries()) {
    if (value.expiresAt <= now) {
      walletChallenges.delete(key);
    }
  }
}

app.post(
  "/api/v1/webhooks/dodo",
  express.raw({ type: "application/json" }),
  dodoWebhooksHandler
);

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

app.get("/api/config", (req, res) => {
  res.status(200).json({
    apiSignerPublicKey: apiSignerPublicKey.toBase58(),
  });
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
        allowed_payment_method_types: ['credit', 'debit'],
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
  "/api/auth/wallet/challenge",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const { wallet } = req.body as {
        wallet?: string;
      };

      if (!wallet) {
        return res.status(400).json({ message: "wallet is required" });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      try {
        // Validate wallet format early to avoid issuing invalid challenges.
        new PublicKey(wallet);
      } catch (e) {
        return res.status(400).json({ message: "Invalid wallet public key" });
      }

      pruneExpiredChallenges();

      const nonce = randomBytes(16).toString("hex");
      const message = `Verify wallet ownership for Quota\nNonce:${nonce}`;
      const expiresAt = Date.now() + WALLET_CHALLENGE_TTL_MS;
      const challengeKey = getChallengeKey(userId, wallet);

      walletChallenges.set(challengeKey, {
        nonce,
        message,
        expiresAt,
      });

      return res.status(200).json({
        message: "Wallet challenge created",
        data: {
          nonce,
          message,
          expiresAt,
        },
      });
    } catch (error) {
      console.error("Wallet challenge error:", error);
      return res.status(500).json({ message: "Internal server error" });
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

      if (!Array.isArray(signature) || signature.length === 0) {
        return res.status(400).json({ message: "Invalid signature payload" });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Ensure user has a company (companyMiddleware attaches it or null)
      const company = req.company;
      if (!company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      pruneExpiredChallenges();

      const challengeKey = getChallengeKey(userId, wallet);
      const challenge = walletChallenges.get(challengeKey);

      if (!challenge || challenge.nonce !== nonce) {
        return res
          .status(401)
          .json({ message: "Wallet challenge is missing or invalid" });
      }

      if (challenge.expiresAt <= Date.now()) {
        walletChallenges.delete(challengeKey);
        return res.status(401).json({ message: "Wallet challenge expired" });
      }

      const message = new TextEncoder().encode(challenge.message);

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

      // One-time challenge use to prevent replay.
      walletChallenges.delete(challengeKey);

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

app.get(
  "/api/auth/wallet/status",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const company = req.company;
      if (!company) {
        return res
          .status(200)
          .json({ verified: false, wallet: null, vaultPda: null });
      }

      return res.status(200).json({
        verified: !!company.ownerWalletPubkey,
        wallet: company.ownerWalletPubkey ?? null,
        vaultPda: company.vaultPda ?? null,
      });
    } catch (error) {
      console.error("Wallet status error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get(
  "/api/v1/vault",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const company = req.company;

      if (!company) {
        return res.status(200).json({
          message: "Vault not found",
          data: null,
          error: null,
        });
      }

      let totalDeposited = 0;

      if (company.vaultPda) {
        try {
          const vaultPublicKey = new PublicKey(company.vaultPda);
          const vaultTokenAccount = deriveAssociatedTokenAddress(
            vaultPublicKey,
            USDC_MINT
          );

          const accountInfo = await connection.getAccountInfo(vaultTokenAccount);

          if (accountInfo) {
            const balance = await connection.getTokenAccountBalance(
              vaultTokenAccount
            );
            totalDeposited = balance.value.uiAmount ?? 0;
          }
        } catch (error) {
          console.error("Vault balance fetch error:", error);
        }
      }

      return res.status(200).json({
        message: "Vault fetched successfully",
        data: {
          vaultPda: company.vaultPda ?? null,
          ownerWalletPubkey: company.ownerWalletPubkey ?? null,
          totalDeposited,
          active: Boolean(company.vaultPda),
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        },
        error: null,
      });
    } catch (error) {
      console.error("Vault fetch error:", error);
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

app.post(
  "/api/v1/vault/deposit",
  authMiddleware,
  companyMiddleware,
  async (req: express.Request, res: express.Response) => {
    try {
      const company = req.company;

      if (!company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      if (!company.ownerWalletPubkey) {
        return res
          .status(400)
          .json({ message: "Connect and verify a wallet first" });
      }

      const { amount, txSignature } = req.body as {
        amount?: number | string;
        txSignature?: string;
      };

      const parsedAmount = Number(amount);

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res
          .status(400)
          .json({ message: "Valid deposit amount is required" });
      }

      if (!txSignature) {
        return res
          .status(400)
          .json({ message: "Transaction signature is required" });
      }

      const ownerWallet = new PublicKey(company.ownerWalletPubkey);
      const [vaultPda] = deriveVaultPda(ownerWallet);

      const tx = await connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return res.status(400).json({ message: "Transaction not found on chain" });
      }

      if (tx.meta?.err) {
        return res.status(400).json({
          message: "Transaction failed on chain",
          error: tx.meta,
        });
      }

      await prisma.company.update({
        where: { id: company.id },
        data: {
          vaultPda: vaultPda.toBase58(),
        },
      });

      return res.status(200).json({
        message: "Deposit recorded successfully",
        data: {
          vaultPda: vaultPda.toBase58(),
          amount: parsedAmount,
          txSignature,
        },
        error: null,
      });
    } catch (error) {
      console.error("Vault deposit error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.post(
  "/api/v1/vault/withdraw",
  authMiddleware,
  companyMiddleware,
  async (req: express.Request, res: express.Response) => {
    try {
      const company = req.company;

      if (!company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      const { txSignature } = req.body as { txSignature?: string };

      if (!txSignature) {
        return res.status(400).json({ message: "Transaction signature is required" });
      }

      const tx = await connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return res.status(400).json({ message: "Transaction not found on chain" });
      }

      if (tx.meta?.err) {
        return res.status(400).json({
          message: "Transaction failed on chain",
          error: tx.meta,
        });
      }

      return res.status(200).json({
        message: "Withdrawal recorded successfully",
        data: {
          txSignature,
        },
        error: null,
      });
    } catch (error) {
      console.error("Vault withdraw error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.post(
  "/api/v1/vault/close",
  authMiddleware,
  companyMiddleware,
  async (req: express.Request, res: express.Response) => {
    try {
      const company = req.company;

      if (!company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      const { txSignature } = req.body as { txSignature?: string };

      if (!txSignature) {
        return res.status(400).json({ message: "Transaction signature is required" });
      }

      const tx = await connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return res.status(400).json({ message: "Transaction not found on chain" });
      }

      if (tx.meta?.err) {
        return res.status(400).json({
          message: "Transaction failed on chain",
          error: tx.meta,
        });
      }

      await prisma.company.update({
        where: { id: company.id },
        data: {
          vaultPda: null,
        },
      });

      return res.status(200).json({
        message: "Vault closed successfully",
        data: {
          txSignature,
        },
        error: null,
      });
    } catch (error) {
      console.error("Vault close error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.post(
  "/api/v1/vaults",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      if (!req.company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      if (!req.company.ownerWalletPubkey) {
        return res
          .status(400)
          .json({ message: "Connect and verify a wallet first" });
      }

      const { txSignature } = req.body as { txSignature?: string };

      const [vaultPda] = deriveVaultPda(
        new PublicKey(req.company.ownerWalletPubkey)
      );

      const existingVault = await connection.getAccountInfo(vaultPda);

      if (existingVault) {
        const updatedCompany = await prisma.company.update({
          where: { id: req.company.id },
          data: {
            vaultPda: vaultPda.toBase58(),
          },
        });

        return res.status(200).json({
          message: "Vault already exists",
          data: {
            vaultPda: updatedCompany.vaultPda,
            txSignature: txSignature ?? null,
          },
          success: null,
        });
      }

      if (!txSignature) {
        return res
          .status(400)
          .json({ message: "Transaction signature is required" });
      }

      try {
        const tx = await connection.getTransaction(txSignature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
          return res
            .status(400)
            .json({ message: "Transaction not found on chain" });
        }

        if (tx.meta?.err) {
          return res.status(400).json({
            message: "Transaction failed on chain",
            error: tx.meta,
          });
        }
      } catch (error) {
        console.error("Error fetching transaction:", error);
        return res
          .status(400)
          .json({ message: "Could not verify transaction on chain" });
      }

      const updatedCompany = await prisma.company.update({
        where: { id: req.company.id },
        data: {
          vaultPda: vaultPda.toBase58(),
        },
      });

      return res.status(200).json({
        message: "Vault created successfully",
        data: {
          vaultPda: updatedCompany.vaultPda,
          txSignature,
        },
        success: null,
      });
    } catch (error) {
      console.error("Vault creation error:", error);
      return res
        .status(500)
        .json({ message: "Internal server error", success: false, data: null });
    }
  }
);

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

app.get(
  "/api/v1/seats",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const seats = await prisma.seat.findMany({
        where: {
          companyId: req.company?.id,
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      });
      return res.status(200).json({
        message: "Seats fetched successfully",
        data: seats,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching seats:", error);
      res.status(500).json({ message: "Failed to fetch seats" });
    }
  }
);

app.post(
  "/api/v1/seats",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        seatType,
        holderPubkey,
        monthlyLimit,
        txSignature,
        seatId,
      } = req.body as {
        name?: string;
        seatType?: number | string;
        holderPubkey?: string;
        monthlyLimit?: number;
        txSignature?: string;
        seatId?: string;
      };

      if (!req.company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.company.vaultPda) {
        return res
          .status(400)
          .json({ message: "Connect and initialize a vault first" });
      }

      if (!name?.trim()) {
        return res.status(400).json({ message: "Seat name is required" });
      }

      const normalizedSeatType =
        seatType === 0 || seatType === "0" || seatType === "HUMAN"
          ? "HUMAN"
          : seatType === 1 || seatType === "1" || seatType === "AGENT"
            ? "AGENT"
            : null;

      if (!normalizedSeatType) {
        return res.status(400).json({ message: "Invalid seat type" });
      }

      if (!holderPubkey) {
        return res
          .status(400)
          .json({ message: "Holder public key is required" });
      }

      if (!txSignature) {
        return res
          .status(400)
          .json({ message: "Transaction signature is required" });
      }

      if (!seatId) {
        return res.status(400).json({ message: "Seat id is required" });
      }

      const validatedMonthlyLimit = monthlyLimit;

      if (
        typeof validatedMonthlyLimit !== "number" ||
        !Number.isInteger(validatedMonthlyLimit) ||
        validatedMonthlyLimit <= 0
      ) {
        return res
          .status(400)
          .json({ message: "Monthly limit must be a positive integer" });
      }

      let holderKey: PublicKey;

      try {
        holderKey = new PublicKey(holderPubkey);
      } catch (error) {
        return res.status(400).json({ message: "Invalid holder public key" });
      }

      let parsedSeatId: bigint;

      try {
        parsedSeatId = BigInt(seatId);
      } catch (error) {
        return res.status(400).json({ message: "Seat id must be a valid u64" });
      }

      if (parsedSeatId <= 0n) {
        return res
          .status(400)
          .json({ message: "Seat id must be greater than 0" });
      }

      const [seatPda] = deriveSeatPda(
        new PublicKey(req.company.vaultPda),
        parsedSeatId
      );

      const existingSeat = await prisma.seat.findFirst({
        where: {
          companyId: req.company.id,
          holderPubkey: holderKey.toBase58(),
        },
      });

      if (existingSeat) {
        return res.status(409).json({
          message: "A seat already exists for this holder",
        });
      }

      try {
        const tx = await connection.getTransaction(txSignature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
          return res
            .status(400)
            .json({ message: "Transaction not found on chain" });
        }

        if (tx.meta?.err) {
          return res.status(400).json({
            message: "Transaction failed on chain",
            error: tx.meta,
          });
        }
      } catch (error) {
        console.error("Error fetching seat transaction:", error);
        return res
          .status(400)
          .json({ message: "Could not verify seat transaction on chain" });
      }

      const onChainSeat = await connection.getAccountInfo(seatPda);

      if (!onChainSeat) {
        return res.status(400).json({
          message: "Seat account was not found on-chain",
        });
      }

      if (!onChainSeat.owner.equals(PROGRAM_ID)) {
        return res.status(400).json({
          message: "Seat account owner mismatch",
        });
      }

      const seat = await prisma.seat.create({
        data: {
          name: name.trim(),
          seatType: normalizedSeatType,
          holderPubkey: holderKey.toBase58(),
          seatPda: seatPda.toBase58(),
          monthlyLimit: validatedMonthlyLimit,
          company: {
            connect: {
              id: req.company.id,
            },
          },
          createdByUser: {
            connect: {
              id: req.user.id,
            },
          },
          updatedByUser: {
            connect: {
              id: req.user.id,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Seat created successfully",
        data: {
          ...seat,
          seatId: parsedSeatId.toString(),
          seatPda: seatPda.toBase58(),
        },
        error: null,
      });
    } catch (error) {
      console.error("Error creating seat:", error);
      res.status(500).json({ message: "Failed to create seat" });
    }
  }
);

app.patch(
  "/api/v1/seats/:id/toggle",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params as { id?: string };
      const { txSignature } = req.body as { txSignature?: string };

      if (!req.company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!id) {
        return res.status(400).json({ message: "Seat id is required" });
      }

      if (!txSignature) {
        return res
          .status(400)
          .json({ message: "Transaction signature is required" });
      }

      const seat = await prisma.seat.findFirst({
        where: {
          id,
          companyId: req.company.id,
        },
      });

      if (!seat) {
        return res.status(404).json({ message: "Seat not found" });
      }

      try {
        const tx = await connection.getTransaction(txSignature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
          return res
            .status(400)
            .json({ message: "Transaction not found on chain" });
        }

        if (tx.meta?.err) {
          return res.status(400).json({
            message: "Transaction failed on chain",
            error: tx.meta,
          });
        }
      } catch (error) {
        console.error("Error fetching seat toggle transaction:", error);
        return res
          .status(400)
          .json({ message: "Could not verify seat toggle on chain" });
      }

      const onChainSeat = await connection.getAccountInfo(
        new PublicKey(seat.seatPda)
      );

      if (!onChainSeat) {
        return res.status(400).json({
          message: "Seat account was not found on-chain",
        });
      }

      if (!onChainSeat.owner.equals(PROGRAM_ID)) {
        return res.status(400).json({
          message: "Seat account owner mismatch",
        });
      }

      const updatedSeat = await prisma.seat.update({
        where: {
          id: seat.id,
        },
        data: {
          active: !seat.active,
          updatedByUser: {
            connect: {
              id: req.user.id,
            },
          },
        },
      });

      return res.status(200).json({
        message: `Seat ${updatedSeat.active ? "activated" : "deactivated"} successfully`,
        data: updatedSeat,
        error: null,
      });
    } catch (error) {
      console.error("Error toggling seat:", error);
      res.status(500).json({ message: "Failed to toggle seat" });
    }
  }
);

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
