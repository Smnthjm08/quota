use anchor_lang::prelude::*;

#[account]
pub struct SeatAccount {
    pub vault: Pubkey,  // which vault this belongs to
    pub holder: Pubkey, // who is using this seat
    pub bump: u8,
    pub monthly_limit: u32,    // max allowed usage
    pub used_this_period: u32, // current usage
    pub period_start: i64,     // reset tracking
}

impl SeatAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 4 + 4 + 8 + 1;
}
