import { Router } from "express";
import { quotaMiddleware } from "../middlewares/quota.ts";

const router = Router();
router.use(quotaMiddleware());

// 1 price per call
router.get("/echo", (req, res) => {
  const seat = (req as any).seat;
  res.json({
    message: "hello from Quota",
    seat: seat.name,
    timestamp: Date.now(),
    txSignature: (req as any).txSignature,
  });
});

// 5 price per call
router.get("/data", (req, res) => {
  const seat = (req as any).seat;
  res.json({
    data: [
      { id: 1, metric: "api_calls_today", value: 47 },
      { id: 2, metric: "price_remaining", value: 453 },
      { id: 3, metric: "vault_balance", value: "48.50 USDC" },
    ],
    seat: seat.name,
    priceUsed: 5,
    txSignature: (req as any).txSignature,
  });
});

// 20 price per call
router.post("/generate", async (req, res) => {
  const seat = (req as any).seat;
  const prompt = req.body?.prompt ?? "Hello";

  res.json({
    result: `AI response to: "${prompt}" — generated with on-chain quota enforcement by Quota.`,
    model: "quota-demo-v1",
    seat: seat.name,
    priceUsed: 20,
    txSignature: (req as any).txSignature,
  });
});

export default router;
