import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [customSessionClient()],
});

export const { signIn, signUp, useSession } = authClient;
