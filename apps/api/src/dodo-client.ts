import dotenv from "dotenv";
import DodoPayments from "dodopayments";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(new URL("../../../.env", import.meta.url));

dotenv.config({ path: envPath, override: false });

const dodoApiKeyValue = process.env.DODO_PAYMENTS_API_KEY;

if (!dodoApiKeyValue) {
  throw new Error(
    "Missing DODO_PAYMENTS_API_KEY. Load it from the repo .env file before starting the API."
  );
}

export const dodoApiKey = dodoApiKeyValue;

const rawMode = process.env.DODO_PAYMENTS_ENVIRONMENT;

export const mode: "test_mode" | "live_mode" =
  rawMode === "live_mode" ? "live_mode" : "test_mode";

export const dodoWebhookKey =
  process.env.DODO_PAYMENTS_WEBHOOK_KEY ??
  process.env.DODO_PAYMENTS_WEBHOOK_SECRET ??
  null;

export const maskedDodoApiKey = `${dodoApiKey.slice(0, 4)}...${dodoApiKey.slice(-4)}`;

export const dodoClient = new DodoPayments({
  bearerToken: dodoApiKey,
  environment: mode,
  ...(dodoWebhookKey ? { webhookKey: dodoWebhookKey } : {}),
});
