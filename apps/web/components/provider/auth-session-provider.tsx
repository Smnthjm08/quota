"use client";

import { authClient, useSession } from "@workspace/auth/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type AppCompany, type AppSession } from "@/lib/auth-session";

type AuthSessionContextValue = {
  session: AppSession;
  company: AppCompany;
  isPending: boolean;
  refreshSession: () => Promise<AppSession>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(
  undefined
);

export function AuthSessionProvider({
  initialSession,
  children,
}: {
  initialSession: AppSession;
  children: ReactNode;
}) {
  const { data: liveSession, isPending } = useSession();
  const [manualSession, setManualSession] =
    useState<AppSession>(initialSession);

  useEffect(() => {
    if (liveSession) {
      setManualSession(liveSession as AppSession);
    }
  }, [liveSession]);

  const session = (liveSession as AppSession | null) ?? manualSession ?? null;
  const company = session?.company ?? null;

  const refreshSession = useCallback(async () => {
    const refreshedSessionResponse = await authClient.getSession();
    const refreshedSession = ((
      refreshedSessionResponse as { data?: AppSession }
    )?.data ?? (refreshedSessionResponse as AppSession)) as AppSession;

    setManualSession(refreshedSession);

    return refreshedSession;
  }, []);

  const value = useMemo<AuthSessionContextValue>(() => {
    return {
      session,
      company,
      isPending,
      refreshSession,
    };
  }, [session, company, isPending, refreshSession]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSessionContext() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error(
      "useAuthSessionContext must be used within AuthSessionProvider"
    );
  }

  return context;
}
