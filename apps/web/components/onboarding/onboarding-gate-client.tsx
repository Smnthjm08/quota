"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function OnboardingGateClient() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) return;
        const data = await res.json();
        const target: string = data?.route || "/onboarding/company";

        if (!mounted) return;

        if (
          pathname &&
          pathname.startsWith("/onboarding") &&
          pathname !== target
        ) {
          router.replace(target);
        }
      } catch (err) {
        console.error("Onboarding gate error", err);
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  return null;
}
