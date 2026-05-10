export interface SessionUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
}

export interface SessionCompany {
  id: string;
  name: string;
  size?: string | null;
  website?: string | null;
  status: "PENDING" | "ACTIVE" | "ON_HOLD" | "DISABLED";
  planId?: number | null;
  maxAllowedSeats?: number | null;
  vaultPda?: string | null;
  ownerWalletPubkey?: string | null;
  createdAt: Date;
  updatedAt: Date;
  plan?: {
    id: number;
    name: string;
  } | null;
}

export interface SessionData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthSession {
  session: SessionData;
  user: SessionUser;
  company: SessionCompany | null;
}
