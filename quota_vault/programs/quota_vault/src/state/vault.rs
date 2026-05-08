use anchor_lang::prelude::*;

#[account]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub api_signer: Pubkey,

    pub total_deposited: u64,     // Total USDC funded into vault
    pub total_assigned: u64,     // Total seat budget assigned
    pub total_spent: u64,     // Total lifetime spend

    pub bump: u8,
    pub active: bool,

    // 0 = Free
    // 1 = Starter
    // 2 = Team
    pub plan: u8,

    pub created_at: i64,
}

impl VaultAccount {
    pub const SPACE: usize =
        8 +  // discriminator
        32 + // owner
        32 + // api_signer
        8 +  // total_deposited
        8 +  // total_assigned
        8 +  // total_spent
        1 +  // bump
        1 +  // active
        1 +  // plan
        8;   // created_at
}