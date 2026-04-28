"use client";

import { Button } from "@workspace/ui/components/button";
import { useSession } from "@workspace/auth/client";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function AuthActions() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <Button variant="outline" disabled className="rounded-lg">
        Loading...
      </Button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Signed in as {session.user.name ?? session.user.email}
        </span>
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button asChild>
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild variant="secondary">
        <Link href="/signup">Signup</Link>
      </Button>
    </div>
  );
}