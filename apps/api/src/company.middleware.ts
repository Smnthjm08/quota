import type { NextFunction, Request, Response } from "express";
import { prisma } from "@workspace/db";

/**
 * Middleware to fetch and attach the authenticated user's company to the request.
 * Should be applied after authMiddleware.
 */
async function companyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    // Fetch company owned by this user
    const company = await prisma.company.findFirst({
      where: {
        ownerId: req.user.id,
      },
    });

    // Attach company to request (null if user has no company yet)
    req.company = company ?? null;

    next();
  } catch (error) {
    console.error("Company middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export default companyMiddleware;
