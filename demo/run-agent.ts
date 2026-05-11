import fetch from "node-fetch";

const API_BASE = "http://localhost:4004";
// This should be the holderPubkey of an active Seat created on the dashboard
const AGENT_PUBKEY = "6MfxAvVWyBGJcbF2ys3hbMVxak3zQ12nh4yroZr3x9B8";

async function callAPI(route: string, price: number) {
  const start = Date.now();

  const res = await fetch(`${API_BASE}${route}`, {
    method: route === "/api/generate" ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "x-wallet-pubkey": AGENT_PUBKEY,
    },
    body:
      route === "/api/generate"
        ? JSON.stringify({ prompt: "summarize the state of AI agents in 2025" })
        : undefined,
  });

  const data = (await res.json()) as any;
  const ms = Date.now() - start;

  if (res.status === 200) {
    console.log(
      `✓ ${route} | ${price} price | ${ms}ms | tx: ${data.txSignature?.slice(0, 12)}...`
    );
  } else if (res.status === 402) {
    console.log(`✗ ${route} | BLOCKED | ${data.error} | ${data.message}`);
    if (data.onChainProof) {
      console.log(
        `  on-chain proof: https://explorer.solana.com/tx/${data.onChainProof}?cluster=devnet`
      );
    }
  }

  return { status: res.status, data };
}

async function main() {
  console.log(`\nQuota Agent Demo`);
  console.log(`Wallet: ${AGENT_PUBKEY}`);
  console.log(`─────────────────────────────────\n`);

  // make calls until quota is hit
  for (let i = 1; i <= 12; i++) {
    const route =
      i <= 5 ? "/api/echo" : i <= 8 ? "/api/data" : "/api/generate";
    const price =
      route === "/api/echo" ? 1 : route === "/api/data" ? 5 : 20;

    await callAPI(route, price);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`Check Solana Explorer:`);
  console.log(
    `https://explorer.solana.com/address/${AGENT_PUBKEY}?cluster=devnet`
  );
}

main().catch(console.error);
