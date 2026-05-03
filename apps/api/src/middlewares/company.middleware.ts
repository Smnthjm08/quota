import type { NextFunction, Request, Response } from "express";
import { prisma } from "@workspace/db";

async function companyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    const company = await prisma.company.findFirst({
      where: {
        ownerId: req.user.id,
      },
    });

    req.company = company ?? null;

    next();
  } catch (error) {
    console.error("Company middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export default companyMiddleware;
