import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import {
  type AuthSession,
  type SessionCompany,
  type SessionUser,
} from "../types/session.types.ts";
import { auth } from "@workspace/auth/auth";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      company?: SessionCompany | null;
    }
  }
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as AuthSession | null;

    if (!session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = session.user;
    req.company = session.company ?? null;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
}

export default authMiddleware;
