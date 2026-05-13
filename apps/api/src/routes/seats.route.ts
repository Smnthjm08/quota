import { Request, Response } from "express";
import {prisma} from "@workspace/db"
import authMiddleware from "../middlewares/auth.middleware";
import companyMiddleware from "../middlewares/company.middleware";
import app, { formatUsdcAmount, normalizeSeatTypeInput, programValueToSeatType, recordUsageEvent, toSafeNumber } from "../index";
import { PublicKey } from '@solana/web3.js';
import { deriveSeatPda, PROGRAM_ID } from "@workspace/anchor-client";
import { connection, program } from "../lib/anchor-client";
import { USDC_SCALE } from "../constants";

app.post(
  "/api/v1/seats",
  authMiddleware,
  companyMiddleware,
  async (req: Request, res: Response) => {
    try {
      const company = req.company;

      if (!company) {
        return res.status(400).json({ message: "Company not found for user" });
      }

      if (
        company.maxAllowedSeats !== null &&
        company.maxAllowedSeats !== undefined
      ) {
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
        onChainSeatLimitRaw === null
          ? null
          : Math.floor(onChainSeatLimitRaw / 1_000_000);

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

      if (
        onChainSeatLimit === null ||
        onChainSeatLimit !== validatedMonthlyLimit
      ) {
        return res.status(400).json({
          message: "Seat limit does not match on-chain transaction",
        });
      }

      // Defensive server-side check: ensure vault has enough unassigned funds
      const vaultOnChain = await program.account.vaultAccount.fetch(
        new PublicKey(req.company.vaultPda)
      );
      const vaultTotalDepositedRaw =
        toSafeNumber(vaultOnChain.totalDeposited) ?? 0;
      const vaultTotalDepositedHuman = Math.floor(
        vaultTotalDepositedRaw / 1_000_000
      );

      const assignedAgg = await prisma.seat.aggregate({
        where: { companyId: req.company.id },
        _sum: { monthlyLimit: true },
      });

      const currentlyAssigned = assignedAgg._sum.monthlyLimit ?? 0;

      if (
        currentlyAssigned + validatedMonthlyLimit >
        vaultTotalDepositedHuman
      ) {
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
  async (req : Request, res: Response) => {
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
          monthlyLimit: (() => {
            // If the seat is inactive, its allocated balance is returned to the vault,
            // so we set the database limit to 0 to reflect the current on-chain state.
            if (!onChainSeatData.active) {
              return 0;
            }
            const onChainLimitRaw = toSafeNumber(onChainSeatData.limit);
            return onChainLimitRaw === null
              ? seat.monthlyLimit
              : Math.floor(onChainLimitRaw / 1_000_000);
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
        onChainLimitRaw === null
          ? null
          : Math.floor(onChainLimitRaw / USDC_SCALE);

      const vaultTotalDepositedRaw =
        toSafeNumber(vaultOnChain.totalDeposited) ?? 0;
      const vaultTotalAssignedRaw =
        toSafeNumber(vaultOnChain.totalAssigned) ?? 0;
      const availableBalanceBase = Math.max(
        vaultTotalDepositedRaw - vaultTotalAssignedRaw,
        0
      );
      const currentSeatLimitBase =
        onChainLimitRaw ?? seat.monthlyLimit * USDC_SCALE;
      const requiredAdditionalBalanceBase = Math.max(
        newLimit * USDC_SCALE - currentSeatLimitBase,
        0
      );
      const requiredAdditionalBalanceHuman =
        requiredAdditionalBalanceBase / USDC_SCALE;
      const availableBalanceHuman = availableBalanceBase / USDC_SCALE;

      if (requiredAdditionalBalanceBase > availableBalanceBase) {
        return res.status(400).json({
          message: `Insufficient vault funds. This update needs ${formatUsdcAmount(requiredAdditionalBalanceHuman)} more USDC, but only ${formatUsdcAmount(availableBalanceHuman)} USDC is available.`,
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