use anchor_lang::prelude::*;

#[account]
pub struct SeatAccount {

    // Parent treasury vault
    pub vault: Pubkey,

    // Human or AI identity
    pub holder: Pubkey,

    // Current usage
    pub consumed: u64,

    // Maximum allowed spend
    pub limit: u64,

    // Deterministic seat identity
    pub seat_id: u64,

    // 1 = HUMAN
    // 2 = AGENT
    pub seat_type: u8,

    pub bump: u8,

    pub active: bool,

    pub created_at: i64,
}

impl SeatAccount {

    pub const SPACE: usize =
        8 +  // discriminator
        32 + // vault
        32 + // holder
        8 +  // consumed
        8 +  // limit
        8 +  // seat_id
        1 +  // seat_type
        1 +  // bump
        1 +  // active
        8;   // created_at
}
