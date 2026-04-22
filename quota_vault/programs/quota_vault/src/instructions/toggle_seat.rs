use anchor_lang::prelude::*;

use crate::{
    constants::{SEAT_SEED, VAULT_SEED},
    error::QuotaError,
    state::{seat::SeatAccount, vault::VaultAccount},
};

#[derive(Accounts)]
pub struct ToggleSeat<'info> {
    #[account(
        constraint = authority.key() == vault.owner @ QuotaError::UnauthorizedSigner
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

pub fn toggle_seat(ctx: Context<ToggleSeat>) -> Result<()> {
    let seat = &mut ctx.accounts.seat;

    seat.active = !seat.active;

    Ok(())
}
