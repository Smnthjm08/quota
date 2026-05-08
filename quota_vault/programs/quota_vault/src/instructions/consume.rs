use anchor_lang::prelude::*;

use crate::{
    constants::{SEAT_SEED, VAULT_SEED},
    error::QuotaError,
    state::{seat::SeatAccount, vault::VaultAccount},
};

#[derive(Accounts)]
pub struct Consume<'info> {
    #[account(
        constraint =
            authority.key() == vault.api_signer
            @ QuotaError::UnauthorizedSigner
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
        has_one = vault,
        seeds = [
            SEAT_SEED,
            vault.key().as_ref(),
            &seat.seat_id.to_le_bytes()
        ],
        bump = seat.bump
    )]
    pub seat: Account<'info, SeatAccount>,
}

pub fn consume_handler(ctx: Context<Consume>, amount: u64) -> Result<()> {
    require!(amount > 0, QuotaError::InvalidAmount);

    let vault = &mut ctx.accounts.vault;

    let seat = &mut ctx.accounts.seat;

    require!(vault.active, QuotaError::VaultInactive);

    require!(seat.active, QuotaError::SeatInactive);

    let new_consumed = seat
        .consumed
        .checked_add(amount)
        .ok_or(QuotaError::MathOverflow)?;

    require!(new_consumed <= seat.limit, QuotaError::QuotaExceeded);

    seat.consumed = new_consumed;

    vault.total_spent = vault
        .total_spent
        .checked_add(amount)
        .ok_or(QuotaError::MathOverflow)?;

    Ok(())
}
