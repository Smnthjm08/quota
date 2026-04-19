use anchor_lang::prelude::*;

#[account]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub bump: u8,
    // pub authority: Pubkey,
    // pub used_balance: u64,
    // pub updated_at: u64,
    // pub created_at: u64,
}

impl VaultAccount{
    pub const SPACE: usize = 8 + 32 + 1;
}