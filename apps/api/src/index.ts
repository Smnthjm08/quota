import express from "express";
import helmet from "helmet";
import cors from "cors";
import { randomBytes } from "crypto";
import { prisma } from "@workspace/db";
import companyMiddleware from "./middlewares/company.middleware.ts";
import nacl from "tweetnacl";
import {
  PublicKey,
  SendTransactionError,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import {
  deriveSeatPda,
  deriveVaultPda,
  PROGRAM_ID,
} from "@workspace/anchor-client";
import {
  apiKeypair,
  apiSignerPublicKey,
  connection,
  program,
} from "./lib/anchor-client.ts";
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

type VaultFundingResult = {
  amount: number;
  txSignature: string | null;
  errorMessage?: string;
};

function toSafeNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (
    typeof value === "bigint" ||
    typeof value === "string" ||
    (typeof value === "object" && value !== null && "toString" in value)
  ) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

const USDC_SCALE = 1_000_000;

function formatUsdcAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(value);
}

async function recordUsageEvent(params: {
  companyId: string;
  type:
    | "VAULT_CREATED"
    | "VAULT_FUNDED"
    | "SEAT_CREATED"
    | "SEAT_UPDATED"
    | "SEAT_TOGGLED";
  title: string;
  amountUsdc?: number | null;
  seatId?: string | null;
  txSignature?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return prisma.usageEvent.create({
    data: {
      companyId: params.companyId,
      type: params.type,
      title: params.title,
      amountUsdc: params.amountUsdc ?? null,
      seatId: params.seatId ?? null,
      txSignature: params.txSignature ?? null,
      metadata: params.metadata ? (params.metadata as any) : undefined,
    },
  });
}

function normalizeSeatTypeInput(
  seatType: number | string | undefined
): "HUMAN" | "AGENT" | null {
  if (
    seatType === 0 ||
    seatType === "0" ||
    seatType === 1 ||
    seatType === "1" ||
    seatType === "HUMAN"
  ) {
    return "HUMAN";
  }

  if (
    seatType === 2 ||
    seatType === "2" ||
    seatType === "AGENT"
  ) {
    return "AGENT";
  }

  return null;
}

function programValueToSeatType(seatType: number): "HUMAN" | "AGENT" | null {
  if (seatType === 1) {
    return "HUMAN";
  }

  if (seatType === 2) {
    return "AGENT";
  }

  return null;
}

async function fundVaultForPlan(
  vaultPda: PublicKey,
  planId?: number | null
): Promise<VaultFundingResult> {
  if (!planId) {
    return { amount: 0, txSignature: null };
  }

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { initDeposit: true, key: true },
  });

  const initDeposit = plan?.initDeposit ?? 0;
  const targetAmount = new BN(initDeposit).mul(new BN(1_000_000));

  if (targetAmount.lte(new BN(0))) {
    return { amount: 0, txSignature: null };
  }

  const vaultAccount = await program.account.vaultAccount.fetch(vaultPda);
  const currentDeposited = new BN(vaultAccount.totalDeposited.toString());

  if (currentDeposited.gte(targetAmount)) {
    return { amount: 0, txSignature: null };
  }

  const depositAmount = targetAmount.sub(currentDeposited);
  const vaultTokenAccount = deriveAssociatedTokenAddress(vaultPda, USDC_MINT);
  const apiSignerTokenAccount = deriveAssociatedTokenAddress(
    apiSignerPublicKey,
    USDC_MINT
  );

  const apiSignerTokenAccountInfo = await connection.getAccountInfo(
    apiSignerTokenAccount
  );
  if (!apiSignerTokenAccountInfo) {
    return {
      amount: 0,
      txSignature: null,
      errorMessage:
        "API signer USDC account is missing. Fund the treasury with USDC before creating a vault.",
    };
  }

  const apiSignerTokenBalance = await connection.getTokenAccountBalance(
    apiSignerTokenAccount
  );
  const availableAmount = BigInt(apiSignerTokenBalance.value.amount);

  if (availableAmount < BigInt(depositAmount.toString())) {
    return {
      amount: depositAmount.toNumber(),
      txSignature: null,
      errorMessage: `API signer USDC balance is insufficient. Need ${depositAmount.toString()} base units (${initDeposit} USDC) but only ${apiSignerTokenBalance.value.uiAmountString ?? "0"} USDC is available.`,
    };
  }

  try {
    const transaction = new Transaction();

    const vaultTokenAccountInfo = await connection.getAccountInfo(vaultTokenAccount);
    if (!vaultTokenAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          apiKeypair.publicKey,
          vaultTokenAccount,
          vaultPda,
          USDC_MINT,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    transaction.add(
      await program.methods
        .depositToVault(depositAmount)
        .accountsPartial({
          vault: vaultPda,
          authority: apiSignerPublicKey,
          mint: USDC_MINT,
          fromTokenAccount: apiSignerTokenAccount,
          vaultTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()
    );

    transaction.feePayer = apiKeypair.publicKey;
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;

    const txSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [apiKeypair],
      { commitment: "confirmed" }
    );

    return { amount: depositAmount.toNumber(), txSignature };
  } catch (error) {
    if (error instanceof SendTransactionError) {
      const logs = await error.getLogs(connection);
      console.error("Vault funding transaction logs:", logs);

      return {
        amount: 0,
        txSignature: null,
        errorMessage:
          logs?.find((log) => log.toLowerCase().includes("insufficient funds")) ??
          error.message ??
          "Vault funding transaction failed",
      };
    }

    throw error;
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

      if (plan.priceCents === 0) {
        const currentCompany = req.company;

        if (!currentCompany) {
          return res.status(400).json({ message: "Company not found for user" });
        }

        const freeSubscriptionId = `free-${currentCompany.id}-${plan.id}`;

        const updatedCompany = await prisma.$transaction(async (tx) => {
          const updatedCompany = await tx.company.update({
            where: { id: currentCompany.id },
            data: {
              planId: plan.id,
              maxAllowedSeats: plan.maxAllowedSeats ?? null,
              status: "ACTIVE",
            },
          });

          await tx.subscription.upsert({
            where: { companyId: currentCompany.id },
            create: {
              companyId: currentCompany.id,
              planId: plan.id,
              dodoSubscriptionId: freeSubscriptionId,
              dodoCustomerId: null,
              status: "ACTIVE",
            },
            update: {
              planId: plan.id,
              dodoSubscriptionId: freeSubscriptionId,
              dodoCustomerId: null,
              status: "ACTIVE",
            },
          });

          return updatedCompany;
        });

        return res.status(200).json({
          message: "Free plan activated successfully",
          data: {
            company: updatedCompany,
            subscription: {
              companyId: currentCompany.id,
              planId: plan.id,
              dodoSubscriptionId: freeSubscriptionId,
              status: "ACTIVE",
            },
          },
          error: null,
        });
      }

      const checkout = await dodoClient.checkoutSessions.create({
        product_cart: [{ product_id: plan.dodoProductId, quantity: 1 }],
        ...(trialPeriodDays > 0
          ? { subscription_data: { trial_period_days: trialPeriodDays } }
          : {}),
        allowed_payment_method_types: ["credit", "debit", "upi_collect", "upi_intent", "crypto_currency"],
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


app.get("/api/auth/wallet/check", authMiddleware, async (req, res) => {
  try {
    const wallet = (req.query.wallet as string) ?? null;

    if (!wallet) {
      return res.status(400).json({ message: "wallet query param is required" });
    }

    const existing = await prisma.company.findFirst({
      where: { ownerWalletPubkey: wallet },
      select: { id: true, ownerId: true },
    });

    return res.status(200).json({
      exists: Boolean(existing),
      companyId: existing?.id ?? null,
      ownerId: existing?.ownerId ?? null,
    });
  } catch (error) {
    console.error("Wallet check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

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

          const accountInfo =
            await connection.getAccountInfo(vaultTokenAccount);

          if (accountInfo) {
            const balance =
              await connection.getTokenAccountBalance(vaultTokenAccount);
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
      orderBy: [{ priceCents: "asc" }, { id: "asc" },],
      where: {
        interval: "MONTH"
      }
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

// Get available topup plans
app.get(
  "/api/v1/plans/topup",
  async (req: express.Request, res: express.Response) => {
    try {
      const topupPlans = await prisma.plan.findMany({
        where: {
          interval: "ONETIME",
        },
        orderBy: {
          priceCents: "asc",
        },
      });

      res.status(200).json({
        message: "Topup plans fetched successfully",
        data: topupPlans,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching topup plans:", error);
      res.status(500).json({ error: "Failed to fetch topup plans" });
    }
  }
);

app.post(
  "/api/v1/vault/topup-checkout",
  authMiddleware,
  companyMiddleware,
  async (req: express.Request, res: express.Response) => {
    try {
      const planId = Number(req.body?.planId);

      if (!Number.isInteger(planId)) {
        return res.status(400).json({ message: "A valid planId is required" });
      }

      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return res.status(400).json({ message: "Plan does not exist" });
      }

      if (plan.interval !== "ONETIME") {
        return res.status(400).json({ message: "Invalid plan type. Must be a topup product." });
      }

      if (!req.company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      if (!req.company.vaultPda) {
        return res.status(400).json({ message: "Initialize your vault before funding" });
      }

      const user = req.user;

      if (!user?.id || !user.email || !user.name) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const checkout = await dodoClient.checkoutSessions.create({
        product_cart: [{ product_id: plan.dodoProductId, quantity: 1 }],
        allowed_payment_method_types: ["credit", "debit", "upi_collect", "upi_intent", "crypto_currency"],
        customer: {
          email: user.email,
          name: user.name,
        },
        metadata: {
          companyId: req.company.id,
          ownerId: user.id,
          planId: String(plan.id),
          planKey: plan.key,
          topupAmount: String(plan.priceCents / 100),
          vaultPda: req.company.vaultPda,
        },
        return_url: `${frontendUrl}/vault?success=topup`,
      });

      res.status(200).json({
        message: "Topup Checkout Session Created",
        data: checkout,
        error: null,
      });
    } catch (error) {
      console.error("Topup checkout error:", error);
      res.status(500).json({ error: "Failed to create topup checkout session" });
    }
  }
);

// Billing: list invoices and download invoice or raw payload
app.get(
  "/api/v1/billing/invoices",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const company = req.company;

      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // List payments stored in DB for this company and enrich via SDK
      const payments = await prisma.dodoPayment.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const invoices = await Promise.all(
        payments.map(async (p) => {
          try {
            if (dodoClient && (dodoClient as any).payments && typeof (dodoClient as any).payments.retrieve === "function") {
              const paymentObj = await (dodoClient as any).payments.retrieve(p.paymentId);
              return {
                paymentId: p.paymentId,
                companyId: p.companyId,
                amount: paymentObj?.total_amount ?? p.amount ?? null,
                currency: paymentObj?.currency ?? p.currency ?? null,
                createdAt: paymentObj?.created_at ?? p.createdAt,
                invoiceUrl: paymentObj?.invoice_url ?? null,
              };
            }
          } catch (err) {
            console.error("Failed to retrieve payment from Dodo SDK:", err);
          }

          return {
            paymentId: p.paymentId,
            companyId: p.companyId,
            amount: p.amount ?? null,
            currency: p.currency ?? null,
            createdAt: p.createdAt,
            invoiceUrl: null,
          };
        })
      );

      return res.status(200).json({ message: "Invoices fetched", data: invoices, error: null });
    } catch (error) {
      console.error("Billing invoices error:", error);
      return res.status(500).json({ message: "Failed to fetch invoices" });
    }
  }
);

app.get(
  "/api/v1/billing/invoice/:paymentId/download",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const rawId = req.params.paymentId;
      const paymentId = Array.isArray(rawId) ? rawId[0] : rawId;

      if (typeof paymentId !== "string" || paymentId.trim().length === 0) {
        return res.status(400).json({ message: "paymentId is required" });
      }

      // Prefer SDK invoices endpoint (binary)
      try {
        if (
          dodoClient &&
          (dodoClient as any).invoices &&
          (dodoClient as any).invoices.payments &&
          typeof (dodoClient as any).invoices.payments.retrieve === "function"
        ) {
          const dodoRes = await (dodoClient as any).invoices.payments.retrieve(paymentId);
          if (dodoRes && typeof dodoRes.arrayBuffer === "function") {
            const pdfBuffer = Buffer.from(await dodoRes.arrayBuffer());
            const fileName = `invoice-${paymentId}.pdf`;
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            res.setHeader("Content-Type", "application/pdf");
            return res.status(200).send(pdfBuffer);
          }
        }
      } catch (err) {
        console.error("Failed to fetch invoice PDF from Dodo SDK:", err);
      }

      // Fallback: fetch payment and redirect to invoice URL
      try {
        if (dodoClient && (dodoClient as any).payments && typeof (dodoClient as any).payments.retrieve === "function") {
          const paymentObj = await (dodoClient as any).payments.retrieve(paymentId);
          const invoiceUrl = paymentObj?.invoice_url ?? paymentObj?.invoiceUrl ?? null;
          if (invoiceUrl && typeof invoiceUrl === "string") {
            return res.redirect(invoiceUrl);
          }
        }
      } catch (err) {
        console.error("Failed to fetch payment/invoice URL from Dodo SDK:", err);
      }

      return res.status(404).json({ message: "Invoice not available for this paymentId" });
    } catch (error) {
      console.error("Invoice download error:", error);
      return res.status(500).json({ message: "Failed to download invoice" });
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
        return res
          .status(400)
          .json({ message: "Transaction signature is required" });
      }

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
        return res
          .status(400)
          .json({ message: "Transaction signature is required" });
      }

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
      let fundingResult: VaultFundingResult = {
        amount: 0,
        txSignature: null,
      };

  app.post(
    "/api/v1/vault/deposit/server",
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

        const { amount } = req.body as { amount?: number | string };
        const parsedAmount = Number(amount);

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          return res
            .status(400)
            .json({ message: "Valid deposit amount is required" });
        }

        const ownerWallet = new PublicKey(company.ownerWalletPubkey);
        const [vaultPda] = deriveVaultPda(ownerWallet);

        const vaultAccount = await connection.getAccountInfo(vaultPda);
        if (!vaultAccount) {
          return res
            .status(400)
            .json({ message: "Initialize the vault before depositing" });
        }

        const vaultTokenAccount = deriveAssociatedTokenAddress(vaultPda, USDC_MINT);
        const apiSignerTokenAccount = deriveAssociatedTokenAddress(
          apiSignerPublicKey,
          USDC_MINT
        );

        const apiSignerTokenAccountInfo = await connection.getAccountInfo(
          apiSignerTokenAccount
        );
        if (!apiSignerTokenAccountInfo) {
          return res.status(400).json({
            message:
              "API signer USDC token account does not exist. Fund the signer treasury first.",
          });
        }

        const vaultTokenAccountInfo = await connection.getAccountInfo(
          vaultTokenAccount
        );
        if (!vaultTokenAccountInfo) {
          return res.status(400).json({
            message:
              "Vault USDC token account does not exist. Create the vault token account first.",
          });
        }

        const txSignature = await program.methods
          .depositToVault(new BN(parsedAmount).mul(new BN(1_000_000)))
          .accountsPartial({
            vault: vaultPda,
            authority: apiSignerPublicKey,
            mint: USDC_MINT,
            fromTokenAccount: apiSignerTokenAccount,
            vaultTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        await prisma.company.update({
          where: { id: company.id },
          data: {
            vaultPda: vaultPda.toBase58(),
          },
        });

        await recordUsageEvent({
          companyId: company.id,
          type: "VAULT_FUNDED",
          title: "Vault funded",
          amountUsdc: parsedAmount,
          txSignature,
          metadata: {
            vaultPda: vaultPda.toBase58(),
            source: "api_deposit",
          },
        });

        return res.status(200).json({
          message: "Vault funded successfully",
          data: {
            vaultPda: vaultPda.toBase58(),
            amount: parsedAmount,
            txSignature,
          },
          error: null,
        });
      } catch (error) {
        console.error("Server vault deposit error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  );

      if (existingVault) {
        fundingResult = await fundVaultForPlan(vaultPda, req.company.planId);

        if (fundingResult.errorMessage) {
          return res.status(400).json({
            message: fundingResult.errorMessage,
          });
        }

        const updatedCompany = await prisma.company.update({
          where: { id: req.company.id },
          data: {
            vaultPda: vaultPda.toBase58(),
          },
        });

        return res.status(200).json({
          message:
            fundingResult.txSignature && fundingResult.amount > 0
              ? "Vault already exists and was funded"
              : "Vault already exists",
          data: {
            vaultPda: updatedCompany.vaultPda,
            txSignature: txSignature ?? null,
            fundingTxSignature: fundingResult.txSignature,
            fundedAmount: fundingResult.amount,
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

      fundingResult = await fundVaultForPlan(vaultPda, req.company.planId);

      if (fundingResult.errorMessage) {
        return res.status(400).json({
          message: fundingResult.errorMessage,
        });
      }

      if (fundingResult.txSignature === null && fundingResult.amount > 0) {
        return res.status(400).json({
          message: "Vault created, but it could not be funded automatically",
        });
      }

      const updatedCompany = await prisma.company.update({
        where: { id: req.company.id },
        data: {
          vaultPda: vaultPda.toBase58(),
        },
      });

      await recordUsageEvent({
        companyId: req.company.id,
        type: "VAULT_CREATED",
        title:
          fundingResult.txSignature && fundingResult.amount > 0
            ? "Vault created and funded"
            : "Vault created",
        amountUsdc: fundingResult.amount > 0 ? fundingResult.amount : null,
        txSignature: fundingResult.txSignature ?? txSignature ?? null,
        metadata: {
          vaultPda: updatedCompany.vaultPda,
          fundedAmount: fundingResult.amount,
        },
      });

      return res.status(200).json({
        message:
          fundingResult.txSignature && fundingResult.amount > 0
            ? "Vault created and funded successfully"
            : "Vault created successfully",
        data: {
          vaultPda: updatedCompany.vaultPda,
          txSignature,
          fundingTxSignature: fundingResult.txSignature,
          fundedAmount: fundingResult.amount,
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

      const normalizedSeats = await Promise.all(
        seats.map(async (seat) => {
          try {
            const onChainSeatData = await program.account.seatAccount.fetch(
              new PublicKey(seat.seatPda)
            );
            const onChainLimitRaw = toSafeNumber(onChainSeatData.limit);
            const onChainConsumedRaw = toSafeNumber(onChainSeatData.consumed);

            return {
              ...seat,
              active: Boolean(onChainSeatData.active),
              consumed: onChainConsumedRaw ?? seat.consumed,
              monthlyLimit:
                onChainLimitRaw === null
                  ? seat.monthlyLimit
                  : Math.floor(onChainLimitRaw / 1_000_000),
            };
          } catch {
            return seat;
          }
        })
      );

      return res.status(200).json({
        message: "Seats fetched successfully",
        data: normalizedSeats,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching seats:", error);
      res.status(500).json({ message: "Failed to fetch seats" });
    }
  }
);

app.get(
  "/api/v1/usage",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      if (!req.company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      const seats = await prisma.seat.findMany({
        where: {
          companyId: req.company.id,
        },
        orderBy: [{ active: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
      });

      const usageEvents = await prisma.usageEvent.findMany({
        where: {
          companyId: req.company.id,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          seat: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const vaultDeposited = req.company.vaultPda
        ? (() => {
            return 0;
          })()
        : 0;

      let totalDeposited = vaultDeposited;

      if (req.company.vaultPda) {
        try {
          const vaultAccount = await program.account.vaultAccount.fetch(
            new PublicKey(req.company.vaultPda)
          );
          const vaultDepositedRaw = toSafeNumber(vaultAccount.totalDeposited);
          totalDeposited =
            vaultDepositedRaw === null
              ? 0
              : Math.floor(vaultDepositedRaw / 1_000_000);
        } catch {
          totalDeposited = 0;
        }
      }
      const usedBalance = seats.reduce(
        (total, seat) => total + (seat.active ? seat.monthlyLimit : 0),
        0
      );
      const consumedBalance = seats.reduce(
        (total, seat) => total + seat.consumed,
        0
      );
      const availableBalance = Math.max(totalDeposited - usedBalance, 0);

      return res.status(200).json({
        message: "Usage fetched successfully",
        data: {
          summary: {
            totalDeposited,
            usedBalance,
            availableBalance,
            activeSeats: seats.filter((seat) => seat.active).length,
            totalSeats: seats.length,
            consumedBalance,
          },
          seats,
          events: usageEvents,
        },
        error: null,
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage" });
    }
  }
);


app.post(
  "/api/v1/seats",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const company = req.company;

      if (!company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      if (company.maxAllowedSeats !== null && company.maxAllowedSeats !== undefined) {
        const seatCount = await prisma.seat.count({
          where: {
            companyId: company.id,
          },
        });

        if (seatCount >= company.maxAllowedSeats) {
          return res.status(400).json({
            message: `Seat limit reached for your plan (${company.maxAllowedSeats} seats)`,
          });
        }
      }

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

      const normalizedSeatType = normalizeSeatTypeInput(seatType);

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

      const onChainSeatData = await program.account.seatAccount.fetch(seatPda);
      const onChainSeatTypeValue = toSafeNumber(onChainSeatData.seatType);
      const onChainSeatType = onChainSeatTypeValue
        ? programValueToSeatType(onChainSeatTypeValue)
        : null;
      const onChainSeatLimitRaw = toSafeNumber(onChainSeatData.limit);
      // on-chain limits are stored in base units (USDC: 1 USDC = 1_000_000 base units)
      const onChainSeatLimit =
        onChainSeatLimitRaw === null ? null : Math.floor(onChainSeatLimitRaw / 1_000_000);

      if (!onChainSeatData.vault.equals(new PublicKey(req.company.vaultPda))) {
        return res.status(400).json({
          message: "Seat vault mismatch",
        });
      }

      if (!onChainSeatData.holder.equals(holderKey)) {
        return res.status(400).json({
          message: "Seat holder mismatch",
        });
      }

      if (onChainSeatType === null) {
        return res.status(400).json({
          message: "Invalid seat type on-chain",
        });
      }

      if (onChainSeatType !== normalizedSeatType) {
        return res.status(400).json({
          message: "Seat type does not match on-chain transaction",
        });
      }

      if (onChainSeatLimit === null || onChainSeatLimit !== validatedMonthlyLimit) {
        return res.status(400).json({
          message: "Seat limit does not match on-chain transaction",
        });
      }

      // Defensive server-side check: ensure vault has enough unassigned funds
      const vaultOnChain = await program.account.vaultAccount.fetch(
        new PublicKey(req.company.vaultPda)
      );
      const vaultTotalDepositedRaw = toSafeNumber(vaultOnChain.totalDeposited) ?? 0;
      const vaultTotalDepositedHuman = Math.floor(vaultTotalDepositedRaw / 1_000_000);

      const assignedAgg = await prisma.seat.aggregate({
        where: { companyId: req.company.id },
        _sum: { monthlyLimit: true },
      });

      const currentlyAssigned = assignedAgg._sum.monthlyLimit ?? 0;

      if (currentlyAssigned + validatedMonthlyLimit > vaultTotalDepositedHuman) {
        return res.status(400).json({
          message:
            "Insufficient vault funds: creating this seat would exceed the vault's deposited amount",
        });
      }

      const seat = await prisma.seat.create({
        data: {
          name: name.trim(),
          seatType: onChainSeatType,
          holderPubkey: onChainSeatData.holder.toBase58(),
          seatPda: seatPda.toBase58(),
          monthlyLimit: onChainSeatLimit,
          consumed: toSafeNumber(onChainSeatData.consumed) ?? 0,
          active: Boolean(onChainSeatData.active),
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

      await recordUsageEvent({
        companyId: req.company.id,
        type: "SEAT_CREATED",
        title: `Seat ${seat.name} created`,
        amountUsdc: seat.monthlyLimit,
        seatId: seat.id,
        txSignature,
        metadata: {
          seatPda: seat.seatPda,
          seatType: seat.seatType,
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

      if (!req.company.vaultPda) {
        return res
          .status(400)
          .json({ message: "Connect and initialize a vault first" });
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

      const onChainSeatData = await program.account.seatAccount.fetch(
        new PublicKey(seat.seatPda)
      );

      const vaultOnChain = await program.account.vaultAccount.fetch(
        new PublicKey(req.company.vaultPda)
      );

      if (!onChainSeatData.vault.equals(new PublicKey(req.company.vaultPda))) {
        return res.status(400).json({
          message: "Seat vault mismatch",
        });
      }

      const updatedSeat = await prisma.seat.update({
        where: {
          id: seat.id,
        },
        data: {
          active: Boolean(onChainSeatData.active),
          consumed: toSafeNumber(onChainSeatData.consumed) ?? seat.consumed,
          monthlyLimit:
            (() => {
              const onChainLimitRaw = toSafeNumber(onChainSeatData.limit);
              return onChainLimitRaw === null ? seat.monthlyLimit : Math.floor(onChainLimitRaw / 1_000_000);
            })(),
          updatedByUser: {
            connect: {
              id: req.user.id,
            },
          },
        },
      });

      await recordUsageEvent({
        companyId: req.company.id,
        type: "SEAT_TOGGLED",
        title: `Seat ${updatedSeat.active ? "activated" : "deactivated"}`,
        amountUsdc: updatedSeat.monthlyLimit,
        seatId: updatedSeat.id,
        txSignature,
        metadata: {
          active: updatedSeat.active,
          consumed: updatedSeat.consumed,
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

app.patch(
  "/api/v1/seats/:id/update-limit",
  authMiddleware,
  companyMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params as { id?: string };
      const { txSignature, newLimit } = req.body as {
        txSignature?: string;
        newLimit?: number;
      };

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

      if (
        typeof newLimit !== "number" ||
        !Number.isInteger(newLimit) ||
        newLimit <= 0
      ) {
        return res.status(400).json({
          message: "New limit must be a positive integer",
        });
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

      if (!req.company.vaultPda) {
        return res
          .status(400)
          .json({ message: "Connect and initialize a vault first" });
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
        console.error("Error fetching seat update transaction:", error);
        return res.status(400).json({
          message: "Could not verify seat update on chain",
        });
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

      const onChainSeatData = await program.account.seatAccount.fetch(
        new PublicKey(seat.seatPda)
      );

      const vaultOnChain = await program.account.vaultAccount.fetch(
        new PublicKey(req.company.vaultPda)
      );

      if (!onChainSeatData.vault.equals(new PublicKey(req.company.vaultPda))) {
        return res.status(400).json({
          message: "Seat vault mismatch",
        });
      }

      const onChainLimitRaw = toSafeNumber(onChainSeatData.limit);
      const onChainLimit =
        onChainLimitRaw === null ? null : Math.floor(onChainLimitRaw / USDC_SCALE);

      const vaultTotalDepositedRaw =
        toSafeNumber(vaultOnChain.totalDeposited) ?? 0;
      const vaultTotalAssignedRaw = toSafeNumber(vaultOnChain.totalAssigned) ?? 0;
      const availableBalanceBase = Math.max(
        vaultTotalDepositedRaw - vaultTotalAssignedRaw,
        0
      );
      const currentSeatLimitBase = onChainLimitRaw ?? seat.monthlyLimit * USDC_SCALE;
      const requiredAdditionalBalanceBase = Math.max(
        newLimit * USDC_SCALE - currentSeatLimitBase,
        0
      );
      const requiredAdditionalBalanceHuman = requiredAdditionalBalanceBase / USDC_SCALE;
      const availableBalanceHuman = availableBalanceBase / USDC_SCALE;

      if (requiredAdditionalBalanceBase > availableBalanceBase) {
        return res.status(400).json({
          message:
            `Insufficient vault funds. This update needs ${formatUsdcAmount(requiredAdditionalBalanceHuman)} more USDC, but only ${formatUsdcAmount(availableBalanceHuman)} USDC is available.`,
        });
      }

      if (onChainLimit === null || onChainLimit !== newLimit) {
        return res.status(400).json({
          message: "Seat limit does not match on-chain transaction",
        });
      }

      const updatedSeat = await prisma.seat.update({
        where: {
          id: seat.id,
        },
        data: {
          monthlyLimit: onChainLimit,
          consumed: toSafeNumber(onChainSeatData.consumed) ?? seat.consumed,
          active: Boolean(onChainSeatData.active),
          updatedByUser: {
            connect: {
              id: req.user.id,
            },
          },
        },
      });

      await recordUsageEvent({
        companyId: req.company.id,
        type: "SEAT_UPDATED",
        title: "Seat limit updated",
        amountUsdc: updatedSeat.monthlyLimit,
        seatId: updatedSeat.id,
        txSignature,
        metadata: {
          previousLimit: seat.monthlyLimit,
          newLimit: updatedSeat.monthlyLimit,
        },
      });

      return res.status(200).json({
        message: "Seat limit updated successfully",
        data: updatedSeat,
        error: null,
      });
    } catch (error) {
      console.error("Error updating seat limit:", error);
      res.status(500).json({ message: "Failed to update seat limit" });
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
