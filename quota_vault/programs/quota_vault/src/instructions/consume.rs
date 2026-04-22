use anchor_lang::prelude::*;

use crate::{
    constants::{SEAT_SEED, VAULT_SEED},
    error::QuotaError,
    state::{seat::SeatAccount, vault::VaultAccount},
};

#[derive(Accounts)]
pub struct Consume<'info> {
    #[account(
        constraint = authority.key() == vault.api_signer
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.owner.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        mut,
        seeds = [
            SEAT_SEED,
            vault.key().as_ref(),
            &seat.seat_id.to_le_bytes()
        ],
        bump = seat.bump
    )]
    pub seat: Account<'info, SeatAccount>,
}

pub fn consume_handler(ctx: Context<Consume>, credits: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let seat = &mut ctx.accounts.seat;

    require!(vault.active, QuotaError::VaultInactive);

    require!(seat.active, QuotaError::SeatInactive);

    let now = Clock::get()?.unix_timestamp;

    if now - seat.period_start > 2_592_000 {
        seat.consumed = 0;
        seat.period_start = now;
    }

    let new_consumed = seat
        .consumed
        .checked_add(credits)
        .ok_or(QuotaError::MathOverflow)?;

    require!(
        new_consumed <= seat.monthly_limit,
        QuotaError::QuotaExceeded
    );

    seat.consumed = new_consumed;

    Ok(())
}
