import type { Request, Response, NextFunction } from "express";
import { consumeOnChain } from "../services/consume.ts";
import { prisma } from "@workspace/db";

export function quotaMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. get route cost from database
    const routeConfig = await prisma.routeConfig.findFirst({
      where: { path: req.path, active: true },
    });
    if (!routeConfig) return next();

    // 2. get agent identity from header
    const walletPubkey = req.headers["x-wallet-pubkey"] as string;
    if (!walletPubkey) {
      return res.status(401).json({
        error: "missing_identity",
        message:
          "Include x-wallet-pubkey header with your agent wallet address",
      });
    }

    // 3. look up seat in Postgres
    const seat = await prisma.seat.findFirst({
      where: {
        holderPubkey: walletPubkey,
        active: true,
        company: {
          status: "ACTIVE",
          vaultPda: { not: null },
        },
      },
      include: { company: true },
    });

    if (!seat) {
      return res.status(403).json({
        error: "no_seat",
        message: "This wallet has no active seat. Contact your administrator.",
      });
    }

    if (!seat.company.ownerWalletPubkey) {
      return res.status(403).json({
        error: "invalid_company",
        message: "Company vault owner wallet is missing.",
      });
    }

    // 4. call consume on Anchor program
    const result = await consumeOnChain(
      seat.company.ownerWalletPubkey,
      seat.seatPda,
      routeConfig.price
    );

    // 5. if quota exceeded return x402 formatted 402
    if (!result.success) {
      const errorMessages: Record<string, string> = {
        quota_exceeded: `Monthly quota exhausted for seat ${seat.name}. Resets on ${getResetDate(seat)}.`,
        seat_inactive: `Seat ${seat.name} has been suspended. Contact your administrator.`,
        vault_inactive:
          "Organization vault is inactive. Check your billing status.",
        consume_failed: "Unable to verify quota. Please retry.",
      };

      res.setHeader(
        "Www-Authenticate",
        `L402 invoice="quota_exceeded", macaroon=""`
      );

      return res.status(402).json({
        x402Version: 1,
        error: result.error,
        message: errorMessages[result.error!] ?? "Payment required",
        accepts: [
          {
            scheme: "exact",
            network: "solana-devnet",
            payTo: process.env.MERCHANT_WALLET_PUBKEY,
            maxAmountRequired: String(routeConfig.price * 1000),
            asset: process.env.USDC_MINT,
          },
        ],
        onChainProof: result.txSig ?? null,
        seat: seat.name,
        resetDate: getResetDate(seat),
      });
    }

    // 6. write usage event async
    prisma.usageEvent
      .create({
        data: {
          companyId: seat.companyId,
          seatId: seat.id,
          type: "API_CONSUMED",
          title: `API Request: ${req.path}`,
          amountUsdc: routeConfig.price,
          txSignature: result.txSig ?? null,
          metadata: { route: req.path, price: routeConfig.price },
        },
      })
      .catch(console.error);

    // 7. attach context and pass through
    (req as any).seat = seat;
    (req as any).txSignature = result.txSig;

    next();
  };
}

function getResetDate(seat: any): string {
  const created = new Date(seat.createdAt);
  const reset = new Date(created);
  reset.setMonth(reset.getMonth() + 1);
  return reset.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}
