export type AppCompanyPlan = {
  id: number;
  name: string;
} | null;

export type AppCompany = {
  id?: string;
  name?: string;
  size?: string;
  website?: string;
  status?: string;
  planId?: number | null;
  vaultPda?: string | null;
  ownerWalletPubkey?: string | null;
  plan?: AppCompanyPlan;
} | null;

export type AppSession = {
  user?: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  session?: {
    id: string;
  };
  company?: AppCompany;
} | null;
