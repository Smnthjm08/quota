use anchor_lang::prelude::*;

#[account]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub total_deposited: u64,   // total USDC funded
    pub total_allocated: u64,   // sum of all seat limits
    pub bump: u8,
}

impl VaultAccount{
    pub const SPACE: usize = 8 + 32 + 8 + 8 + 1;
}