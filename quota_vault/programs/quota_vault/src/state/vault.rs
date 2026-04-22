use anchor_lang::prelude::*;

#[account]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub api_signer: Pubkey,

    pub total_deposited: u64,
    pub total_allocated: u64,

    pub bump: u8,
    pub active: bool,
    pub plan: u8,

    pub created_at: i64,
    // TODO
    // pub max_deposit_per_tx: u64
}

impl VaultAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 1 + 1 + 1 + 8;
}
