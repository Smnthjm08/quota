import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { type SessionUser } from "./session.types.ts";
import { auth } from "@workspace/auth/auth";
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    console.log("Session data:", session);

    if (!session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
}

export default authMiddleware;
