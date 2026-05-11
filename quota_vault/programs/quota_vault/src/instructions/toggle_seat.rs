use anchor_lang::prelude::*;

use crate::{
    constants::{SEAT_SEED, VAULT_SEED},
    error::QuotaError,
    state::{seat::SeatAccount, vault::VaultAccount},
};

#[derive(Accounts)]
pub struct ToggleSeat<'info> {
    #[account(
        constraint =
            authority.key() == vault.owner
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

pub fn toggle_seat(ctx: Context<ToggleSeat>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    require!(vault.active, QuotaError::VaultInactive);

    let seat = &mut ctx.accounts.seat;

    require!(seat.limit >= seat.consumed, QuotaError::InvalidLimit);

    if seat.active {
        // Deactivating a seat releases its reserved budget back to the vault.
        vault.total_assigned = vault
            .total_assigned
            .checked_sub(seat.limit)
            .ok_or(QuotaError::MathOverflow)?;
        seat.active = false;
    } else {
        // Reactivating a seat reserves its budget again.
        require!(
            vault
                .total_assigned
                .checked_add(seat.limit)
                .ok_or(QuotaError::MathOverflow)?
                <= vault.total_deposited,
            QuotaError::InsufficientFunds
        );

        vault.total_assigned = vault
            .total_assigned
            .checked_add(seat.limit)
            .ok_or(QuotaError::MathOverflow)?;
        seat.active = true;
    }

    Ok(())
}
