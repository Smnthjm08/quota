# Quota: Solana-based Usage & Quota Management System

Quota is a **Solana-powered usage and quota management platform** for B2B/SaaS APIs, enabling on-chain enforcement of usage limits and payments using USDC. It allows companies to deposit funds into a smart contract "Vault" and allocate those funds into individual "Seats" with specific usage limits for API keys, users, or teams.

---

## 🚀 Product Overview

- **Vaults:** Users/companies create a Vault to hold USDC deposits. Funds can be topped up and are tracked on-chain.
- **Seats:** Vault owners allocate funds to "Seats" (sub-accounts) representing API keys, users, or teams, each with its own usage quota.
- **On-Chain Enforcement:** Usage is tracked and enforced on Solana via smart contracts. When a seat consumes its quota (e.g., via API requests), the backend triggers an on-chain `consume` instruction, deducting quota and recording usage.
- **Multi-Layer Validation:** Both on-chain (Rust/Anchor) and off-chain (Node.js API) layers validate and enforce limits, ensuring security and preventing over-allocation.

---

## 🏗️ Architecture

1. **Vault (VaultAccount):**

- Master balance for a user/company.
- Tracks total deposited, assigned, and spent USDC.

1. **Seats (SeatAccount):**

- Sub-allocations for API keys/users/teams.
- Strict checks ensure total assigned never exceeds deposited funds.

1. **Usage Consumption:**

- API requests trigger on-chain quota deduction and event logging.

1. **Validation:**

- On-chain: Enforces limits, throws errors for insufficient funds/quota.
- Off-chain: Backend checks and database mapping for user-friendly units and pre-validation.

---

## 🛠️ Tech Stack

- **Smart Contracts:** Rust & Anchor (`quota_vault`)
- **Client SDK:** TypeScript (`@workspace/anchor-client`)
- **Backend:** Node.js API (`apps/api`) with secure signing
- **Frontend:** Next.js/React (`apps/web`)
- **Database:** Prisma ORM

---

## Quick Start

See the [docs/CONSUME.md](docs/CONSUME.md) for a step-by-step guide to testing the quota flow, and [GUIDE/](GUIDE/) for detailed architecture and integration guides.
