To test the **Quota Consume** flow, you need to simulate an agent (or any client) making requests to the protected API endpoints. Since you already have the API running and the database seeded, here is the complete flow and documentation for testing.

### 1. The "Consume" Flow Architecture

When a request hits a protected route, the following happens:

1. **Middleware Check**: The `quotaMiddleware` looks for an `x-wallet-pubkey` header.
2. **Identity Lookup**: It verifies this wallet has an **Active Seat** in your database.
3. **On-Chain Enforcement**: The API server calls the Solana program's `consume` instruction using its own `API_SIGNER_PRIVATE_KEY` (configured in your `.env`).
4. **Result**:
   - **Success (200 OK)**: The quota is deducted on-chain, a usage event is recorded, and the request proceeds.
   - **Failure (402 Payment Required)**: If the limit is reached or the seat is inactive, it returns an **L402-style** error with on-chain proof.

---

### 2. How to Test (Step-by-Step)

#### Step A: Setup a Test Seat

1. Go to your dashboard (likely `http://localhost:3000`).
2. Create a **Seat** for a wallet you control (or just use a random devnet address like `6MfxAvVWyBGJcbF2ys3hbMVxak3zQ12nh4yroZr3x9B8`).
3. Ensure the **Vault is funded** (you can use the "Top Up" feature or rely on the initial deposit from the plan).

#### Step B: Use the Demo Script

There is a pre-built agent simulation script in your codebase that you can use to test the flow immediately.

**Location**: `scripts/agent/run-agent.ts`

**To run it**:

1. Open a new terminal.
2. Ensure your API is running (`pnpm run dev` at port 4000).
3. Update the `AGENT_PUBKEY` in `scripts/agent/run-agent.ts` to match the seat you created.
4. Run the script:
   ```bash
   # From the root directory
   pnpm run demo:agent
   ```

#### Step C: Manual Test with CURL

You can also test a single endpoint manually:

```bash
curl -X GET http://localhost:4000/api/echo \
  -H "x-wallet-pubkey: YOUR_AGENT_PUBKEY" \
  -H "Content-Type: application/json"
```

---

### 3. Protected Endpoints & Prices

The following routes are currently configured in your `seed.ts` and `protected.ts` router:

| Endpoint        | Method | Cost (USDC) | Purpose                          |
| :-------------- | :----- | :---------- | :------------------------------- |
| `/api/echo`     | `GET`  | 1           | Simple connectivity test.        |
| `/api/data`     | `GET`  | 5           | Returns dummy metrics.           |
| `/api/generate` | `POST` | 20          | Simulates an AI generation call. |

---

### 4. Testing the "Blocked" State (402 Error)

To verify that the "Firewall" actually blocks requests:

1. Edit your seat in the dashboard and set the **Monthly Limit** to something very low (e.g., `5 USDC`).
2. Call `/api/generate` (which costs 20 USDC).
3. The API will return a `402` status code with the following JSON:
   ```json
   {
     "error": "quota_exceeded",
     "message": "Monthly quota exhausted for seat...",
     "onChainProof": "TX_SIGNATURE_HERE"
   }
   ```


### Documentation Reference

- **Middleware Logic**: [quota.ts](file:///Users/smnthjm08/Desktop/qouta-app/apps/api/src/middlewares/quota.ts)
- **On-Chain Service**: [services/consume.ts](file:///Users/smnthjm08/Desktop/qouta-app/apps/api/src/services/consume.ts)
- **Anchor Client (browser tx-builder)**: [client/seat/consume.ts](file:///Users/smnthjm08/Desktop/qouta-app/packages/anchor-client/src/client/seat/consume.ts)
- **Demo Agent Script**: [scripts/agent/run-agent.ts](file:///Users/smnthjm08/Desktop/qouta-app/scripts/agent/run-agent.ts)
- **Solana Program**: [consume.rs](file:///Users/smnthjm08/Desktop/qouta-app/quota_vault/programs/quota_vault/src/instructions/consume.rs)

> [!TIP]
> Since you are running **ngrok** on port 4000, you can also test this by pointing the `API_BASE` in `apps/agent/src/index.ts` to your ngrok URL to test "external" access!
