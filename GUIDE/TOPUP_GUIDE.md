# Vault Topup Functionality

## Overview

The **topup** instruction allows vault owners to deposit tokens directly from their own wallet to their vault. This is the user-initiated deposit mechanism, as opposed to `deposit_to_vault` which is API-signer-only.

## Key Differences

| Feature | `topup_vault` | `deposit_to_vault` |
|---------|--------------|-------------------|
| **Caller** | Vault owner | API signer only |
| **Authority** | Vault owner signs | API signer signs |
| **Use Case** | User top-ups balance | Backend/API transfers |
| **Requires** | Personal wallet | Separate API signer wallet |

## Architecture

### Program Side (Rust/Anchor)

**File:** `quota_vault/programs/quota_vault/src/instructions/topup.rs`

The `TopupVault` context includes:
- **vault**: The vault account (must be active)
- **vault_owner**: The vault owner who is topping up (must be signer)
- **owner_token_account**: Owner's token account (holds tokens to transfer)
- **vault_token_account**: Vault's token account (receives tokens)
- **mint**: The token mint
- **token_program**: SPL Token Program

```rust
pub fn topup_vault_handler(ctx: Context<TopupVault>, amount: u64) -> Result<()> {
    // Transfers from owner's account to vault
    // Updates vault.total_deposited
    // Emits TopupEvent
}
```

### Client Side (TypeScript)

**File:** `packages/anchor-client/src/client/vault/topup-vault.ts`

Two methods available:

#### 1. Build Transaction (for signing in UI)
```typescript
const tx = await buildTopupTransaction({
  connection,
  vaultOwnerPublicKey: userWallet.publicKey,
  vaultPublicKey,
  mintPublicKey,
  ownerTokenAccountPublicKey,
  vaultTokenAccountPublicKey,
  amount,
});

const signature = await wallet.sendTransaction(tx, connection);
```

#### 2. Build Instruction (for composing with other instructions)
```typescript
const instruction = await buildTopupInstruction({...params});
```

## Usage Examples

### React Hook (Frontend)

```typescript
import { useTopupVault } from '@/hooks/use-topup-vault';

function MyComponent() {
  const { topup, isLoading, error } = useTopupVault({
    vaultPublicKey: 'vault_address',
    mintPublicKey: 'usdc_mint',
    ownerTokenAccountPublicKey: 'user_usdc_token_account',
    vaultTokenAccountPublicKey: 'vault_usdc_token_account',
  });

  const handleTopup = async () => {
    try {
      const result = await topup(1_000_000); // 1 USDC (6 decimals)
      console.log('Topup successful:', result.signature);
    } catch (err) {
      console.error('Topup failed:', err);
    }
  };

  return (
    <button onClick={handleTopup} disabled={isLoading}>
      Top Up Vault
    </button>
  );
}
```

### React Component (UI Form)

```typescript
import { TopupVaultForm } from '@/components/vault/TopupVaultForm';

export function VaultPage() {
  return (
    <TopupVaultForm
      vaultPublicKey="vault_address"
      mintPublicKey="usdc_mint"
      ownerTokenAccountPublicKey="user_usdc_token_account"
      vaultTokenAccountPublicKey="vault_usdc_token_account"
      onSuccess={(signature) => {
        console.log('Transaction successful:', signature);
      }}
      onError={(error) => {
        console.error('Transaction failed:', error);
      }}
    />
  );
}
```

### Direct Backend Usage (Node.js/API)

```typescript
import { buildTopupInstruction } from '@quota/anchor-client';
import { Connection, Transaction } from '@solana/web3.js';

async function topupVaultFromBackend() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  const instruction = await buildTopupInstruction({
    connection,
    vaultOwnerPublicKey: vaultOwnerPubkey,
    vaultPublicKey: vaultPubkey,
    mintPublicKey: usdcMint,
    ownerTokenAccountPublicKey: ownerTokenAccount,
    vaultTokenAccountPublicKey: vaultTokenAccount,
    amount: 1_000_000,
  });

  // Compose with other instructions
  const tx = new Transaction().add(instruction);
  
  // Sign and send...
}
```

## Prerequisites

Before calling topup, ensure:

1. **Wallet is connected** (for frontend)
2. **Vault exists** and is active
3. **Owner has sufficient balance** in their token account
4. **Token account addresses are correct** (for USDC or your mint)
5. **Vault token account is initialized**

### Getting Token Account Address

```typescript
import { getAssociatedTokenAddress } from '@solana/spl-token';

const ownerTokenAccount = await getAssociatedTokenAddress(
  USDC_MINT,
  ownerPublicKey
);

const vaultTokenAccount = await getAssociatedTokenAddress(
  USDC_MINT,
  vaultPublicKey
);
```

## Events

The topup instruction emits a `TopupEvent`:

```typescript
pub struct TopupEvent {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub new_total_deposited: u64,
}
```

Listen to events using:

```typescript
program.addEventListener('topupEvent', (event) => {
  console.log(`${event.owner} topup ${event.amount} to vault ${event.vault}`);
  console.log(`New total: ${event.new_total_deposited}`);
});
```

## Error Handling

Possible errors:

| Error | Cause | Solution |
|-------|-------|----------|
| `VaultInactive` | Vault not active | Ensure vault is initialized and active |
| `InvalidDepositAmount` | Amount is 0 or negative | Provide positive amount |
| `UnauthorizedSigner` | Caller is not vault owner | Use correct wallet address |
| `MathOverflow` | Total deposited exceeds u64 | Amount is extremely large |
| `InsufficientFunds` | Owner lacks balance | Ensure sufficient token balance |

## Integration Checklist

- [ ] Deploy updated program to network
- [ ] Update IDL file
- [ ] Export topup functions in `anchor-client` index
- [ ] Create React hook in web app
- [ ] Build UI component
- [ ] Add token account helpers
- [ ] Test with devnet/testnet
- [ ] Add error handling
- [ ] Document for users

## Testing

```bash
# Build program
cd quota_vault
cargo build-sbf

# Run tests
cargo test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Security Notes

- ✅ Only vault owner can topup their own vault
- ✅ Amount checked for positivity
- ✅ Math overflow protected
- ✅ Vault must be active
- ✅ Token accounts validated with constraints
- ✅ Uses Anchor's automatic discriminator validation
