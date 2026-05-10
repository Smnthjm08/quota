import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { SectionHeading } from "./section-heading";

const requests = `POST /api/generate
x-wallet-pubkey: 4xKj8mQrAbCdEfGhIjKlMnOpQrStUvWxYz
Content-Type: application/json

{ "prompt": "summarize this document" }`;

const successResponse = `200 OK
{
  "result": "Here is the summary...",
  "creditsUsed": 20,
  "remaining": 480
}`;

const failureResponse = `402 Payment Required
{
  "error": "quota_exceeded",
  "message": "Monthly quota exhausted. Resets May 28.",
  "onChainProof": "5X7rKpqN3jBwZ..."
}`;

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <Card className="border-white/10 bg-slate-950/80">
      <CardHeader className="border-b border-white/10 pb-4">
        <CardTitle className="text-sm font-medium tracking-[0.24em] text-slate-400 uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-7 text-slate-200">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

export function DeveloperSection() {
  return (
    <section id="docs" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label="Built for developers"
          title="One header. Full enforcement."
          description="No SDK required on the agent side. Agents just include their wallet address in the request header. Quota handles verification, quota checking, and on-chain logging."
          className="mb-10"
        />

        <div className="grid gap-5">
          <CodeBlock title="Agent side — just add one header" code={requests} />
          <div className="grid gap-5 lg:grid-cols-2">
            <CodeBlock
              title="Response when quota is available"
              code={successResponse}
            />
            <CodeBlock
              title="Response when quota is exhausted"
              code={failureResponse}
            />
          </div>
        </div>

        <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-400">
          The 402 is not thrown by our server. It is thrown because a Solana
          program rejected the consume instruction. Verify it yourself on
          Explorer.
        </p>
      </div>
    </section>
  );
}
