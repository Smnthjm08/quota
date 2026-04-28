import express from "express";
import dotenv from "dotenv";
import DodoPayments from 'dodopayments';
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import cors from "cors";
import {prisma} from "@workspace/db"
import authMiddleware from "./auth.middleware.ts";


const envPath = fileURLToPath(new URL("../../../.env", import.meta.url));

dotenv.config({ path: envPath, override: false });

const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;

if (!dodoApiKey) {
  throw new Error(
    "Missing DODO_PAYMENTS_API_KEY. Load it from the repo .env file before starting the API."
  );
}

const rawMode = process.env.DODO_PAYMENTS_ENVIRONMENT;
const mode: 'test_mode' | 'live_mode' = rawMode === 'live_mode' ? 'live_mode' : 'test_mode';
const masked = `${dodoApiKey.slice(0, 4)}...${dodoApiKey.slice(-4)}`;
console.info(
  `DodoPayments init — environment=${mode}, token=${masked}, tokenLength=${dodoApiKey.length}`
);

export const dodoClient = new DodoPayments({
  bearerToken: dodoApiKey,
  environment: mode, // 'test_mode' or 'live_mode'
});

const app: express.Express = express();

// Basic middleware
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
  })
);

app.get("/", authMiddleware, (req, res) => {
  res.send("Hello, World!");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


app.post("/api/v1/onboarding/company", async (req, res) => {
  // Handle company onboarding logic here
  try {
    // const company = req.body;
    const {name, size, website} = req.body;
    console.log("Received company onboarding data:", {name, size, website});
    const company = await prisma.company.create({
      data: {
        name,
        // size,
        website,
        ownerId: "clh8v1y9c0000l6m9g5zq2n1" // TODO: get user id from auth context
      }
    })
    res.status(201).json({message: "Company registered successfully", data: company, error: null});
  } catch (error) {
    console.log("Error during company onboarding:", error);
    res.status(500).json({ error: "Failed to onboard company" });
  }
});

app.post("/api/v1/onboarding/plan", async (req, res) => {
  // Handle plan onboarding logic here
});



app.get("/sub", async (req, res) => {
  try {
    const checkoutUrl = await checkout();
    res.json({ checkoutUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create Dodo checkout session" });
  }
});

async function checkout() {
  const productId = process.env.DODO_TEAM_PRODUCT_ID;

  if (!productId) {
    throw new Error("Missing DODO_TEAM_PRODUCT_ID in environment");
  }

  const session = await dodoClient.checkoutSessions.create({
    product_cart: [
      { product_id: productId, quantity: 1 },
    ],
    // Optional: configure trials for subscription products
    subscription_data: { trial_period_days: 0 },
    customer: {
      email: "sub@example.com",
      name: "Jane Doe",
    },
    return_url: "https://localhost:3000/success",
  });

  console.log(session.checkout_url);
  return session.checkout_url;
}

const PORT = Number(process.env.API_PORT || process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(
  (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

export default app;
