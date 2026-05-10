use anchor_lang::prelude::*;

#[account]
pub struct SeatAccount {

    pub vault: Pubkey,

    pub holder: Pubkey,

    pub consumed: u64,

    pub limit: u64,

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
