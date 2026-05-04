"use client";

import { useAuthSessionContext } from "@/components/provider/auth-session-provider";

export function useAuthSession() {
  return useAuthSessionContext();
}