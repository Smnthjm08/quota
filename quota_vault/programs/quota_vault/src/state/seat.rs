use anchor_lang::prelude::*;

#[account]
pub struct SeatAccount {
    pub vault: Pubkey,
    pub holder: Pubkey,

    pub consumed: u64,
    pub monthly_limit: u64,
    pub seat_id: u64,
    pub period_start: i64,

    pub seat_type: u8,
    pub bump: u8,
    pub active: bool,
}

impl SeatAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1 + 1 + 8; //added extra 8 byte for future alignment - 115
}
