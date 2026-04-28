import express from "express";
import dotenv from "dotenv";
// import { dodoClient } from "./dodo/dodo-client.";
import DodoPayments from 'dodopayments';



dotenv.config({ path: "../../.env", override: false });


export const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: 'test_mode', // defaults to 'live_mode'
});

const app = express();

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/sub", async (req, res) => {
  await checkout();
});

async function checkout() {
  const session = await dodoClient.checkoutSessions.create({
    product_cart: [
      { product_id: process.env.DODO_STARTER_PRODUCT_ID!, quantity: 1 },
    ],
    // Optional: configure trials for subscription products
    subscription_data: { trial_period_days: 0 },
    customer: {
      email: "subscriber@example.com",
      name: "Jane Doe",
    },
    return_url: "https://example.com/success",
  });

  console.log(session.checkout_url);
}

app.get("/api/echo", (req, res) => {
  const requirements = {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "solana-mainnet",
        payTo: "djfnsdjfnjdsndfjs",
        maxAmountRequired: "1000", // 0.001 USDC (in micro units)
        asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        extra: {
          name: "AutoPay Agent",
          description: "/api/echo — 1 credit",
          route: "/api/echo",
        },
      },
    ],
    error: "Payment required",
  };

  // res
  //   .status(402)
  //   .set("X-Payment-Requirements", JSON.stringify(requirements))
  //   .json(requirements);

  res
    .status(402)
    // .set("X-Payment-Requirements", JSON.stringify(requirements))
    .set(
      "X-Payment-Requirements",
      Buffer.from(JSON.stringify(requirements)).toString("base64")
    )

    .json(requirements);
});

const PORT = process.env.API_PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
