"use client";

import { Button } from "@workspace/ui/components/button";
import { authClient } from "@workspace/auth/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);

    try {
      await authClient.signOut();
      router.refresh();
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLogout}
      disabled={isSigningOut}
      className="cursor-pointer rounded-lg"
    >
      {isSigningOut ? "Logging out..." : "Logout"}
    </Button>
  );
}
