Viewed index.ts:2-15
Listed directory qouta-app
Listed directory GUIDE
Viewed BALANCE_CHECKING_FLOW.md:1-409
Viewed TOPUP_GUIDE.md:1-239

Based on the files in the `GUIDE` directory and our recent work on the `consume` integration, I have a strong grasp of the project's architecture and purpose.

Here is a summary of what the Quota App does:

### 🎯 Core Purpose

The project is a **Solana-based Usage & Quota Management System** (likely for B2B or SaaS API usage) backed by USDC deposits. It allows users/companies to deposit funds into a smart contract "Vault" and allocate those funds into individual "Seats" with specific usage limits.

### 🏗️ Architecture & Flow

1. **The Vault (`VaultAccount`)**:
   - A user initializes a vault which acts as a master balance.
   - Users can add funds to their vault via `topup_vault` (direct from their wallet) or `deposit_to_vault` (handled by the backend API signer).
   - The vault tracks `total_deposited`, `total_assigned` (how much has been allocated to seats), and `total_spent` (what has actually been consumed).

2. **Seats (`SeatAccount`)**:
   - Vault owners can create "Seats", each representing a sub-allocation (e.g., a specific API key or user in the company).
   - When a seat is created or updated, the system enforces a **strict balance check**: the sum of all seat limits (`total_assigned`) can never exceed the `total_deposited` in the vault.
   - This ensures that users can never allocate more USDC quota than they have actually deposited.

3. **Usage Consumption (`consume`)**:
   - As a seat generates usage (e.g., making API requests), the backend API signer triggers the `consume` instruction.
   - This increments the seat's `consumed` amount and the vault's `total_spent`, effectively tracking the real-world cost on-chain.

4. **Multi-Layer Validation**:
   - **On-chain (Rust/Anchor):** The smart contract enforces limits in base units (1 USDC = 1,000,000). It throws errors like `InsufficientFunds` or `QuotaExceeded`.
   - **Off-chain (Node.js API):** The backend serves as a defensive layer. It maintains a database (Prisma) mapping human units (e.g., $3) and performs preliminary checks so invalid transactions are caught before wasting Solana gas fees.

### 🛠️ The Tech Stack

- **Smart Contracts:** Rust & Anchor framework (`quota_vault`).
- **Client Integration:** A TypeScript SDK (`@workspace/anchor-client`) that provides helper functions (`buildTopupTransaction`, `createSeat`, etc.) for both the Next.js/React frontend and the Node.js backend.
- **Backend:** An API layer (`apps/api`) responsible for signing sensitive operations (like `deposit_to_vault` and `consume`) using a dedicated `api_signer`.

Let me know if there's a specific area you'd like me to focus on next!
