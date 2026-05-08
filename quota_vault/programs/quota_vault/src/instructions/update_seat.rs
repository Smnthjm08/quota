use anchor_lang::prelude::*;

use crate::{
    constants::{SEAT_SEED, VAULT_SEED},
    error::QuotaError,
    state::{seat::SeatAccount, vault::VaultAccount},
};

#[derive(Accounts)]
pub struct UpdateSeat<'info> {
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

pub fn update_seat(ctx: Context<UpdateSeat>, new_limit: u64) -> Result<()> {
    require!(new_limit > 0, QuotaError::InvalidLimit);

    let vault = &mut ctx.accounts.vault;

    let seat = &mut ctx.accounts.seat;

    require!(vault.active, QuotaError::VaultInactive);

    require!(seat.active, QuotaError::SeatInactive);

    require!(new_limit >= seat.consumed, QuotaError::InvalidLimit);

    let old_limit = seat.limit;

    if new_limit > old_limit {
        let increase = new_limit
            .checked_sub(old_limit)
            .ok_or(QuotaError::MathOverflow)?;

        require!(
            vault
                .total_assigned
                .checked_add(increase)
                .ok_or(QuotaError::MathOverflow)?
                <= vault.total_deposited,
            QuotaError::InsufficientFunds
        );

        vault.total_assigned = vault
            .total_assigned
            .checked_add(increase)
            .ok_or(QuotaError::MathOverflow)?;
    } else if old_limit > new_limit {
        let decrease = old_limit
            .checked_sub(new_limit)
            .ok_or(QuotaError::MathOverflow)?;

        vault.total_assigned = vault
            .total_assigned
            .checked_sub(decrease)
            .ok_or(QuotaError::MathOverflow)?;
    }

    seat.limit = new_limit;

    Ok(())
}
