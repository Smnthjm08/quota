import express from "express";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env", override: false });

const app = express();

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

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
      .set("X-Payment-Requirements", Buffer.from(JSON.stringify(requirements)).toString("base64"))

    .json(requirements);
});

const PORT = process.env.API_PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
