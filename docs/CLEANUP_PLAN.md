# Cleanup Plan — Hackathon MVP → Web3 Portfolio Project

**Context:** This was built for a Solana hackathon. The hackathon is over. The
goal now is not to keep growing it — it's to strip it down to the thing that's
actually impressive (on-chain quota enforcement for AI agents) and cut
everything that makes it read like a generic SaaS billing app. This is the
version that should sit on GitHub for job applications / portfolio review.

**Guiding rule:** every feature has to answer "does this make the Solana story
stronger, or does it dilute it?" If it's the latter, it goes — even if it
works and even if it took real effort to build.

Check items off as you do them. Each item has **what / why / how**.

**Sequencing note:** Phase 0 (below) is structural and comes first — it
changes *where* every file in the rest of this doc lives. Do the collapse
before doing the content-level cuts in P0–P6, otherwise you're editing files
that are about to move/disappear. File paths in P0–P6 refer to the
**pre-collapse** locations; once Phase 0 is done, treat them as "where this
logic currently lives, to be found in its new home under the single Next.js
app" rather than literal paths.

---

## Phase 0 — Collapse the turborepo into a single Next.js app

**Why:** a 6-package turborepo (`api`, `web`, `db`, `auth`, `anchor-client`,
`ui`, plus `eslint-config`/`typescript-config`) is itself part of the
"generic SaaS template" smell this whole cleanup is trying to remove — for a
single product, it's structure with no payoff. It also directly caused the
deployment pain already visible in git history ("fixed api deployment
issue," "vercel deployment fix" — two separate deployables for one product).
better-auth's [`app/api/auth/[...all]/route.ts`](../apps/web/app/api/auth/%5B...all%5D/route.ts)
already proves Next.js Route Handlers can run this app's server-side logic
directly — there's no technical reason the rest of `apps/api` needs to be a
separate Express server.

**End state:** two things in the repo. `quota_vault/` (the Anchor/Cargo
program — stays exactly as-is, it's Rust tooling and was never part of the
JS side) and **one** Next.js app containing everything else. One
`package.json`, one build, one deployment.

> ⚠️ **Current status: mid-collapse, repo is broken.** `turbo.json`,
> `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and the root `tsconfig.json` /
> `.prettierrc` / `.prettierignore` are deleted, but nothing that depended on
> them has been updated yet:
>
> - Root `package.json` scripts still say `turbo build`, `turbo dev`, etc.,
>   and its `devDependencies` still list `@workspace/eslint-config`/
>   `@workspace/typescript-config` as `workspace:*`.
> - `apps/api/package.json` and `apps/web/package.json` still declare
>   `@workspace/anchor-client`, `@workspace/auth`, `@workspace/db`,
>   `@workspace/ui`, `@workspace/eslint-config`, `@workspace/typescript-config`
>   as `workspace:*` — with no `pnpm-workspace.yaml` left to resolve that
>   protocol, `pnpm install` will fail outright.
> - `apps/web/tsconfig.json` and `apps/api/tsconfig.json` still
>   `extends: "@workspace/typescript-config/..."`, which no longer resolves.
> - Root `.eslintrc.js` is stale — its own header comment says "Root-level
>   ESLint config for a **Turborepo workspace**" and it still ignores
>   `**/.turbo/**`.
>
> None of this is wrong as a first step, but don't stop here — the repo
> won't `install` or build again until either (a) the fold-in steps below are
> done for at least one app, or (b) you finish deleting `apps/`/`packages/`
> and replace them with the single app in the same commit. Treat this as
> "mid-flight," not "paused safely."

- [x] **Delete `turbo.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`** — done
  (staged). Root `tsconfig.json`, `.prettierrc`, `.prettierignore`, and
  `.vscode/settings.json` were also removed in the same pass — fine, but
  note `.prettierrc`/`.prettierignore` going away means `pnpm run format`
  (still in root `package.json`, still depends on `prettier` +
  `prettier-plugin-tailwindcss`) now runs with **default** Prettier settings
  instead of your project's conventions (e.g. Tailwind class sorting). If
  that was intentional, fine — if not, a flat `.prettierrc` at the app root
  is a 2-minute add.
- [x] **Related: pruned Dodo/subscription/better-auth agent-skill configs**
  — `.agents/skills/dodo-best-practices/SKILL.md`,
  `.agents/skills/subscription-integration/SKILL.md`,
  `.agents/skills/better-auth-best-practices/SKILL.md`, and
  `skills-lock.json` were deleted. Consistent with dropping Dodo/OAuth — good
  cleanup, don't need to revisit.
- [ ] **Update root `package.json`** — replace `turbo build`/`turbo dev`/
  `turbo lint`/etc. with plain `next build`/`next dev`/etc., drop the
  `workspaces` field, drop `@workspace/eslint-config`/
  `@workspace/typescript-config` from `devDependencies`, drop `turbo` from
  `devDependencies`.
- [ ] **Update `apps/api/package.json` and `apps/web/package.json`** (or
  their merged replacement) — drop every `@workspace/*: workspace:*`
  dependency once that package's code has been folded in per the items
  below.
- [ ] **Replace `.eslintrc.js`** with a flat, non-Turborepo config (drop the
  "Turborepo workspace" comment and the `.turbo` ignore pattern) once
  `packages/eslint-config` is folded in.
- [ ] **Fix `tsconfig.json` `extends` paths** in whatever app(s) remain, once
  `packages/typescript-config` is folded in per the item below.
- [ ] **Run a fresh `pnpm install`** once the above are done, to confirm the
  repo installs clean without any `workspace:*` protocol left.

- [ ] **Port Express routes to Next.js Route Handlers**
  - Every route in [apps/api/src/index.ts](../apps/api/src/index.ts) and
    [apps/api/src/routes/protected.ts](../apps/api/src/routes/protected.ts) /
    [apps/api/src/routes/seats.route.ts](../apps/api/src/routes/seats.route.ts)
    becomes `app/api/<path>/route.ts` with `export async function GET/POST(...)`.
  - Any handler that signs Solana transactions or calls the Anchor program
    (consume, deposit, seat CRUD) **must** run on the Node.js runtime, not
    Edge — add `export const runtime = "nodejs"` to those route files.
    `@solana/web3.js`, `@coral-xyz/anchor`, and `tweetnacl` don't work on
    Edge.

- [ ] **Turn Express middlewares into plain server-side functions**
  - [middlewares/auth.middleware.ts](../apps/api/src/middlewares/auth.middleware.ts),
    [middlewares/company.middleware.ts](../apps/api/src/middlewares/company.middleware.ts),
    [middlewares/quota.ts](../apps/api/src/middlewares/quota.ts) stop being
    an Express `(req, res, next)` chain and become `async function
    requireAuth(req)`, `async function requireCompany(req)`,
    `async function enforceQuota(req)` — called explicitly at the top of
    each route handler, or wrapped in a small helper.
  - Do **not** try to move quota enforcement into `middleware.ts` (Next.js
    Edge middleware) — same Node-runtime constraint as above.

- [ ] **Fold `packages/db` into the app**
  - Move `packages/db/prisma/` to the app root (or `lib/db/prisma/`).
  - Replace `@workspace/db` imports with a local `lib/db.ts` exporting the
    Prisma client singleton.

- [ ] **Fold `packages/auth` into the app**
  - Move [packages/auth/src/auth.ts](../packages/auth/src/auth.ts) and
    `email.ts` into `lib/auth/`. The existing
    `app/api/auth/[...all]/route.ts` catch-all already wires better-auth in
    correctly — this is mostly a file move, not new code.

- [ ] **Fold `packages/anchor-client` into the app**
  - Move into `lib/anchor/` (PDA derivation, instruction builders, IDL/types).
  - Update the `anchor:sync` script (root `package.json`) to copy the IDL/
    types from `quota_vault/target/` straight into `lib/anchor/idl/` instead
    of `packages/anchor-client/src/idl/`.

- [ ] **Fold `packages/ui` into the app**
  - Move shadcn components into `components/ui/` directly. Drop the
    `@workspace/ui` package boundary — there's only ever going to be one
    consumer of these components now.

- [ ] **Flatten config packages**
  - `packages/eslint-config` → a root `eslint.config.js`.
  - `packages/typescript-config` → a root `tsconfig.json` (or the app's
    existing one, extended directly instead of via a workspace package).

- [ ] **Remove turborepo/workspace plumbing**
  - Delete `turbo.json`, `pnpm-workspace.yaml`.
  - Simplify root `package.json` scripts (`turbo build` → `next build`, etc).
  - Delete `apps/` and `packages/` directories once everything above is
    moved out of them.
  - Update `vercel.json` / Vercel project settings to a single deployment
    target instead of two.

- [ ] **Decide `scripts/agent/run-agent.ts`'s new home**
  - It's a standalone demo script hitting the API over HTTP — it doesn't
    need to move, just update `API_BASE`/`pnpm run demo:agent` if the API's
    base path or port changes as part of the collapse.

---

## P0 — Correctness bugs (fix regardless of anything else)

These are things a technical reviewer (or a future employer reading the code)
will find. Fix before doing any of the cutting below, since they're small and
independent.

- [ ] **`withdraw_from_vault` missing invariant check**
  [quota_vault/programs/quota_vault/src/instructions/withdraw_from_vault.rs:41-44](../quota_vault/programs/quota_vault/src/instructions/withdraw_from_vault.rs#L41-L44)
  - **What:** the instruction only checks `total_deposited >= amount`. It never
    checks against `total_assigned`.
  - **Why:** an active vault owner can withdraw funds that are already
    promised to live seats. `consume` never checks the vault's real token
    balance (only `seat.consumed <= seat.limit`), so this silently breaks the
    "an agent can never overspend" guarantee — the whole point of the
    product.
  - **How:** add
    `require!(vault.total_deposited - amount >= vault.total_assigned, QuotaError::InsufficientFunds)`
    before the transfer.

- [ ] **Duplicate route registration bug**
  [apps/api/src/index.ts:1312-1424](../apps/api/src/index.ts#L1312-L1424)
  - **What:** `app.post("/api/v1/vault/deposit/server", ...)` is defined
    *inside* the handler body of `/api/v1/vaults`, so it re-registers itself
    on every call to that route.
  - **Why:** copy-paste leftover; grows the Express route stack unbounded and
    reads as unreviewed code.
  - **How:** move the whole `app.post("/api/v1/vault/deposit/server", ...)`
    block out to top-level scope, alongside the other route definitions.

- [ ] **Inconsistent token program usage**
  - **What:** `withdraw_from_vault.rs` uses legacy `anchor_spl::token`; every
    other instruction (`topup.rs`, `deposit_to_vault.rs`, `consume` via seat,
    `reclaim_treasury.rs`) uses `anchor_spl::token_interface` (Token-2022
    compatible).
  - **Why:** inconsistency reads as unfinished, even though it's not
    functionally broken for SPL Token today.
  - **How:** switch `withdraw_from_vault.rs` to `token_interface` /
    `TransferChecked` to match the rest of the program.

- [ ] **`lib.rs` naming inconsistency**
  [quota_vault/programs/quota_vault/src/lib.rs](../quota_vault/programs/quota_vault/src/lib.rs)
  - **What:** `update_seat_handler` / `toggle_seat_handler` are named with a
    `_handler` suffix at the `#[program]` entrypoint level; every other
    instruction (`consume`, `create_seat`, `initialize_vault`, ...) isn't.
  - **Why:** cosmetic, but it's the kind of thing a careful reviewer notices.
  - **How:** rename to `update_seat` / `toggle_seat` for consistency (mind the
    TS client / IDL regen if you do this — run `pnpm anchor:sync` after).

---

## P1 — Remove Dodo Payments entirely

**Why (overall):** Dodo is a fiat/credit-card payment processor. Leading with
it directly undercuts the "trust-minimized, verifiable on-chain" pitch — a
judge sees "funded by Dodo Payments" and immediately asks why they need
Solana at all. It also means the *default* vault-funding path is your own
backend's custodial keypair calling `deposit_to_vault` on a webhook, not the
user signing a transaction. That's backwards: the trust-minimized path
(`topup_vault`, user-signed) should be the default, and it already exists.

- [ ] **Delete API-side Dodo integration**
  - Files: [apps/api/src/dodo-webhook.ts](../apps/api/src/dodo-webhook.ts),
    [apps/api/src/lib/dodo-client.ts](../apps/api/src/lib/dodo-client.ts)
  - Remove the `/api/v1/webhooks/dodo` route, the `dodoWebhooksHandler`
    import, and the `dodoClient`/`dodoApiKey`/`mode` exports in
    [apps/api/src/index.ts](../apps/api/src/index.ts).

- [ ] **Delete Dodo-backed endpoints in `index.ts`**
  - `/api/v1/onboarding/plan` (Dodo checkout branch — keep only if you keep a
    free/no-payment plan path, otherwise simplify or remove)
  - `/api/v1/plans/topup`, `/api/v1/vault/topup-checkout`
  - `/api/v1/billing/invoices`, `/api/v1/billing/invoice/:paymentId/download`

- [ ] **Remove the billing page**
  - [apps/web/app/(main)/billing/page.tsx](../apps/web/app/(main)/billing/page.tsx)
  - Remove its nav entry in the sidebar.

- [ ] **Remove Dodo-related frontend components/hooks**
  - [apps/web/components/vault/fiat-topup-tab.tsx](../apps/web/components/vault/fiat-topup-tab.tsx)
  - [apps/web/hooks/use-fiat-topup-checkout.ts](../apps/web/hooks/use-fiat-topup-checkout.ts)
  - [apps/web/hooks/use-onboarding-plans.ts](../apps/web/hooks/use-onboarding-plans.ts)
    (only if it's Dodo-plan-specific; check before deleting)
  - [apps/web/components/cards/onboarding-pricing-cards.tsx](../apps/web/components/cards/onboarding-pricing-cards.tsx)
  - Dodo mentions in landing sections: `hero-section.tsx` (the "funded by
    Dodo Payments" line), `features-section.tsx` ("Enterprise Billing" card),
    `pricing-section.tsx`, `how-it-works-section.tsx`, `faq-section.tsx`

- [ ] **Simplify/remove onboarding "plan" step**
  - [apps/web/app/onboarding/plan/page.tsx](../apps/web/app/onboarding/plan/page.tsx),
    [apps/web/app/onboarding/plan/success/page.tsx](../apps/web/app/onboarding/plan/success/page.tsx)
  - If plans still matter for seat limits/tiering, keep the concept but drive
    it entirely from on-chain vault funding, not a Dodo checkout redirect.

- [ ] **Trim Prisma schema**
  [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma)
  - Remove models: `Subscription`, `DodoWebhookEvent`, `DodoPayment`
  - Remove `Plan.dodoProductId` (or the whole `Plan` model if plans aren't
    needed without Dodo — check whether seat/vault logic still reads from it)
  - Remove `Company.subscription` / `Company.dodopayments` relations
  - Write and run a new migration after trimming
    (`pnpm db:migrate`)

- [ ] **Clean env vars**
  [.env.example](../.env.example)
  - Remove: `DODO_PAYMENTS_ENVIRONMENT`, `DODO_PAYMENTS_API_KEY`,
    `DODO_PAYMENTS_WEBHOOK_SECRET`, `DODO_STARTER_PRODUCT_ID`,
    `DODO_TEAM_PRODUCT_ID`, `DODO_10_TOPUP`, `DODO_25_TOPUP`, `DODO_50_TOPUP`

- [ ] **Make `topup_vault` (user-signed) the default/only funding path**
  - Vault page should just be: connect wallet → sign `topup_vault` tx → done.
  - This is the flow that's actually verifiable on-chain and it's already
    fully built in
    [packages/anchor-client/src/client/vault/topup-vault.ts](../packages/anchor-client/src/client/vault/topup-vault.ts) —
    no new code needed, just make it the primary UI instead of a secondary
    tab next to the (now-deleted) fiat option.

---

## P2 — Strip the auth stack down to what the product needs

**Why (overall):** wallet-signature ownership verification is already the
real identity anchor for this product (see
`/api/auth/wallet/challenge` + `/api/auth/wallet/verify` in
[index.ts](../apps/api/src/index.ts#L534-L703)). Running a second, parallel
Web2 auth system (OAuth + email/password + forgot/reset-password) on top of
that is unnecessary surface area and reads as generic-SaaS scaffolding, not a
Web3 product.

- [ ] **Remove GitHub and Google OAuth**
  - [packages/auth/src/auth.ts:12-29](../packages/auth/src/auth.ts#L12-L29) —
    delete the `socialProviders` block entirely.
  - Remove `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET` from
    [.env.example](../.env.example).
  - Remove the GitHub/Google buttons from
    [apps/web/app/(auth)/login/page.tsx](../apps/web/app/(auth)/login/page.tsx)
    and
    [apps/web/app/(auth)/signup/page.tsx](../apps/web/app/(auth)/signup/page.tsx),
    plus any shared auth button components in
    [apps/web/components/auth/](../apps/web/components/auth/).

- [ ] **Drop forgot-password / reset-password flow**
  - [apps/web/app/(auth)/forgot-password/page.tsx](../apps/web/app/(auth)/forgot-password/page.tsx),
    [apps/web/app/(auth)/reset-password/page.tsx](../apps/web/app/(auth)/reset-password/page.tsx)
  - Remove the `sendResetPassword` handler in
    [packages/auth/src/auth.ts](../packages/auth/src/auth.ts) and the
    `reset-password` email template in
    [packages/auth/src/email.ts](../packages/auth/src/email.ts) if unused
    elsewhere.
  - This is real polish for a product with real users; it's dead weight in a
    portfolio demo.

- [ ] **(Stretch, bigger change) Make wallet signature the only login**
  - Instead of "email/password account + bind a wallet to it afterward,"
    consider collapsing to: connect wallet → sign a message → session. This
    removes email/password entirely and makes the product's own README claim
    ("wallet-native") literally true of the login screen, not just the vault.
  - Only do this if there's time — it's a bigger structural change than the
    rest of this list. Everything else above is pure deletion; this one is a
    redesign of the session-creation path.

---

## P3 — Trim company onboarding

**Why:** nothing downstream reads `address`/`state`/`city`/`pinCode`. A PIN
code field is the single most "unedited AI-scaffolded boilerplate" detail in
the whole product — it's the opposite of what you want a reviewer to see
first.

- [ ] Cut the onboarding company form down to `name` + `size` only.
  [apps/web/app/onboarding/company/page.tsx](../apps/web/app/onboarding/company/page.tsx)
- [ ] Drop `address`, `state`, `city`, `pinCode`, `website` from the
  `Company` model in
  [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma)
  (or leave nullable fields in place if migration churn isn't worth it, but
  remove them from the form and the `/api/v1/onboarding/company` handler in
  [index.ts](../apps/api/src/index.ts#L340-L389)).

---

## P4 — Remove dead UI

- [ ] **Delete the `team` page** — [apps/web/app/(main)/team/page.tsx](../apps/web/app/(main)/team/page.tsx)
  is a 7-line stub, redundant with the seats page. Remove its sidebar nav
  entry too.

---

## P5 — Positioning: README + landing copy

**Why:** the current copy leads with "funded by Dodo Payments" and an
"Enterprise Billing" feature card about tax compliance in 220+ countries.
That's the opposite of what should be first. The actual differentiator: a
blocked request returns a **Solana transaction signature as proof**, checkable
by anyone, independent of trusting Quota's own database. That sentence should
be the first thing a reader sees.

- [ ] Rewrite root `README.md` — draft already written, see the review
  conversation for full text. Structure:
  1. One-paragraph problem statement (agents + runaway spend)
  2. "Why this can't be a database column" (verifiability, atomicity,
     ~400ms finality)
  3. How it works (vault → seats → consume → 402-with-proof)
  4. Quick start (`pnpm dev`, `pnpm run demo:agent`)
  5. Stack, with Postgres explicitly labeled as "off-chain indexing/UX only —
     source of truth is on-chain"
- [ ] Rewrite `hero-section.tsx` — replace "funded by Dodo Payments" with the
  verifiability claim.
- [ ] Rewrite `features-section.tsx` — replace the "Enterprise Billing" card
  (Dodo-specific) with something about the `total_assigned <= total_deposited`
  invariant or the on-chain proof mechanism.
- [ ] Check `pricing-section.tsx`, `how-it-works-section.tsx`,
  `faq-section.tsx` for remaining Dodo references and cut/rewrite.

---

## P6 — Stretch goals (only if P0–P5 are done and there's time left)

These are additive, not required for "minimal and job-ready." Do them only if
the cutting above is finished — don't let these become new scope creep.

- [ ] **Formalize the x402 response shape.** The 402 payload in
  [middlewares/quota.ts:77-93](../apps/api/src/middlewares/quota.ts#L77-L93)
  already has `x402Version` and an `accepts` array. Align it against the
  actual [x402 spec](https://github.com/coinbase/x402) so any x402-compatible
  agent framework can talk to Quota with zero custom integration. Mostly
  cleanup of code that already exists.
- [ ] **A Solana Action/Blink for "top up after block."** When a seat gets
  blocked, the 402 response already has everything needed to construct a
  "top up this vault" Blink URL, reusing the existing `topup_vault`
  instruction. This is the best "wow" moment for a demo video/screenshot and
  is a few hours of work, not a rewrite.

---

## What NOT to add

Explicitly out of scope — don't let hackathon-brain talk you into adding these
"because it's a Solana project so it should have X":

- Token-2022 — no feature of it (transfer hooks, confidential transfers,
  etc.) is used by anything in this product. Adding it would be
  checklist-driven complexity, not product improvement.
- Compressed NFTs — no natural fit; seats are fungible-limit PDAs, not
  collectibles.
- Any second payment processor to "replace" Dodo — the whole point is that
  `topup_vault` already solves funding. Don't reintroduce a fiat rail.

---

## Definition of done

The project is "job-ready" when:

1. `git grep -i dodo` (excluding this file and git history) returns nothing.
2. Login is wallet-signature-based, or at minimum email/password with no
   OAuth providers and no forgot/reset-password pages.
3. Onboarding is one screen, no address fields.
4. `pnpm run demo:agent` still works end-to-end and is the entire demo script
   (see full 2–3 minute walkthrough in the review conversation).
5. README opens with the verifiability claim, not a feature list.
